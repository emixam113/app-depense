import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Expense } from '../expense/entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { ExportQueryDto } from './dto/export-query.dto';

interface ParsedTransaction {
  date: Date;
  label: string;
  amount: number;
  isExpense: boolean;
}

interface BankParser {
  name: string;
  parse: (text: string) => ParsedTransaction[];
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // =========================================================
  // ==================  UTILITAIRES SÉCURITÉ  ==================
  // =========================================================

  private sanitizeCsvField(value: string): string {
    if (!value) return value;
    if (/^[=+\-@\t\r]/.test(value)) {
      return `'${value}`;
    }
    return value;
  }

  private sanitizeLabel(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 255);
  }

  private detectRecurring(label: string): {
    label: string;
    isRecurring: boolean;
  } {
    const upperLabel = label.toUpperCase();

    if (upperLabel.includes('NETFLIX')) {
      return { label: 'Netflix', isRecurring: true };
    }
    if (upperLabel.includes('SPOTIFY')) {
      return { label: 'Spotify', isRecurring: true };
    }
    return { label, isRecurring: false };
  }

  private parseFrenchDate(day: string, month: string, year: string): Date {
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(
      `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
    );
  }

  private parseAmount(raw: string): number | null {
    const cleaned = raw
      .replace(/\s/g, '')
      .replace(/\u00A0/g, '')
      .replace(',', '.');
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }

  // =========================================================
  // ==================  PARSERS PAR BANQUE  ==================
  // =========================================================
  // Chaque parser tente de matcher CHAQUE ligne du texte extrait.
  // Si le format ne correspond pas à la banque, il retourne 0 (ou peu de)
  // résultats, et un autre parser prendra le dessus.
  //
  // ⚠️ Base de départ raisonnable par format connu, non testée sur de vrais
  // relevés de chaque banque. Si un format ne matche pas en pratique, ajuste
  // le regex du parser concerné (ou envoie-moi un extrait anonymisé du texte
  // extrait pour que je l'affine).

  private getBankParsers(): BankParser[] {
    return [
      {
        name: 'Crédit Mutuel',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\/\d{2}\/\d{4})\s+\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+(-?[\d\s.,]+)$/,
          ]),
      },
      {
        name: 'Crédit Agricole',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?[\d\s.,]+)\s*€?$/,
          ]),
      },
      {
        // Souvent DD/MM sans année sur la ligne (année dans l'en-tête du relevé)
        name: 'Société Générale',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?[\d\s.,]+)$/,
            /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d\s.,]+)$/,
          ]),
      },
      {
        name: 'BNP Paribas',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(-?[\d\s.,]+)$/,
            /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?[\d\s.,]+)$/,
          ]),
      },
      {
        name: 'Revolut',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\s\w{3}\s\d{4})\s+(.+?)\s+(-?[\d\s.,]+)\s*(?:EUR|€)?$/i,
            /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d\s.,]+)\s*(?:EUR|€)?$/,
          ]),
      },
      {
        name: 'Bankin',
        parse: (text) =>
          this.parseGenericLines(text, [
            /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?[\d\s.,]+)\s*€?$/,
          ]),
      },
    ];
  }

  /**
   * Applique une liste de regex candidats ligne par ligne, et retourne les
   * transactions trouvées avec le PREMIER regex qui obtient des résultats
   * (utile quand une banque a plusieurs variantes de mise en page).
   */
  private parseGenericLines(
    text: string,
    patterns: RegExp[],
  ): ParsedTransaction[] {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const pattern of patterns) {
      const results: ParsedTransaction[] = [];

      for (const line of lines) {
        const match = line.match(pattern);
        if (!match) continue;

        const [, dateRaw, labelRaw, amountRaw] = match;
        const amount = this.parseAmount(amountRaw);
        if (amount === null || amount === 0) continue;

        const date = this.extractDate(dateRaw);
        if (!date || isNaN(date.getTime())) continue;

        const label = this.sanitizeLabel(labelRaw);
        if (!label) continue;

        results.push({
          date,
          label,
          amount: Math.abs(amount),
          isExpense: amount < 0,
        });
      }

      if (results.length > 0) {
        return results;
      }
    }

    return [];
  }

  /**
   * Convertit les différents formats de date rencontrés (JJ/MM/AAAA, JJ.MM.AAAA,
   * JJ/MM, AAAA-MM-JJ, "12 Jan 2024") en objet Date.
   */
  private extractDate(raw: string): Date | null {
    let m = raw.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
    if (m) return this.parseFrenchDate(m[1], m[2], m[3]);

    // JJ/MM sans année (Société Générale) — année courante par défaut ;
    // à ajuster si tu récupères l'année réelle du relevé ailleurs dans le PDF.
    m = raw.match(/^(\d{2})\/(\d{2})$/);
    if (m)
      return this.parseFrenchDate(m[1], m[2], String(new Date().getFullYear()));

    m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}`);

    m = raw.match(/^(\d{2})\s(\w{3})\s(\d{4})$/);
    if (m) {
      const months: Record<string, string> = {
        Jan: '01',
        Feb: '02',
        Mar: '03',
        Apr: '04',
        May: '05',
        Jun: '06',
        Jul: '07',
        Aug: '08',
        Sep: '09',
        Oct: '10',
        Nov: '11',
        Dec: '12',
      };
      const month = months[m[2]];
      if (month) return new Date(`${m[3]}-${month}-${m[1]}`);
    }

    return null;
  }

  // =========================================================
  // ==================  IMPORT CSV  ==================
  // =========================================================

  async importFromCsv(userId: number, fileContent: string): Promise<any> {
    const lines = fileContent.split('\n');
    const detectedSubscriptions = [];
    const expensesToSave = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(';');
      if (columns.length < 3) continue;

      const [dateRaw, labelRaw, amountRaw] = columns;

      const amount = parseFloat(amountRaw.replace(',', '.').trim());

      const cleanedLabel = this.sanitizeLabel(
        labelRaw.replace(/"/g, '').trim(),
      );
      const { label, isRecurring } = this.detectRecurring(cleanedLabel);

      const parts = dateRaw.split('/');
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

      if (isNaN(date.getTime())) continue;
      if (isNaN(amount)) continue;

      const expense = this.expenseRepository.create({
        user: { id: userId },
        label: label,
        amount: Math.abs(amount),
        date: date,
        type: amount < 0 ? 'expense' : 'income',
        isRecurring: isRecurring,
      });

      if (isRecurring) {
        detectedSubscriptions.push({
          name: label,
          day: date.getDate(),
          amount: Math.abs(amount),
        });
      }

      expensesToSave.push(expense);
    }

    await this.expenseRepository.save(expensesToSave);

    return {
      success: true,
      count: expensesToSave.length,
      subscriptions: detectedSubscriptions,
    };
  }

  // =========================================================
  // ==================  IMPORT PDF (MULTI-BANQUES)  ==================
  // =========================================================

  async importFromPDF(userId: number, fileBuffer: Buffer): Promise<any> {
    // API v2 de pdf-parse (breaking change par rapport à la v1) :
    // on instancie un PDFParse avec le buffer, puis on appelle getText().
    // Il faut appeler destroy() ensuite pour libérer les ressources internes.
    const { PDFParse } = require('pdf-parse');

    const PDF_PARSE_TIMEOUT_MS = 10_000;

    const parser = new PDFParse({ data: fileBuffer });

    let extractedText: string;
    try {
      const result: any = await Promise.race([
        parser.getText(),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Le fichier PDF n'a pas pu être analysé (timeout)."),
              ),
            PDF_PARSE_TIMEOUT_MS,
          ),
        ),
      ]);
      extractedText = result.text;
    } finally {
      // Toujours libérer les ressources, même si le parsing échoue/timeout.
      await parser.destroy();
    }

    // Détection automatique : on essaie chaque banque et on garde
    // celle qui a matché le plus de lignes.
    const parsers = this.getBankParsers();

    let bestBank = 'Inconnu';
    let bestResults: ParsedTransaction[] = [];

    for (const parser of parsers) {
      const results = parser.parse(extractedText);
      if (results.length > bestResults.length) {
        bestResults = results;
        bestBank = parser.name;
      }
    }

    if (bestResults.length === 0) {
      return {
        success: false,
        count: 0,
        subscriptions: [],
        message:
          "Le format de ce relevé n'a pas été reconnu. Formats supportés actuellement : Crédit Mutuel, Crédit Agricole, Société Générale, BNP Paribas, Revolut, Bankin.",
      };
    }

    const expensesToSave = [];
    const detectedSubscriptions = [];

    for (const transaction of bestResults) {
      const { label, isRecurring } = this.detectRecurring(transaction.label);

      const expense = this.expenseRepository.create({
        user: { id: userId },
        label: label,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.isExpense ? 'expense' : 'income',
        isRecurring: isRecurring,
      });

      if (isRecurring) {
        detectedSubscriptions.push({
          name: label,
          day: transaction.date.getDate(),
          amount: transaction.amount,
        });
      }

      expensesToSave.push(expense);
    }

    if (expensesToSave.length > 0) {
      await this.expenseRepository.save(expensesToSave);
    }

    return {
      success: true,
      count: expensesToSave.length,
      subscriptions: detectedSubscriptions,
      detectedBankFormat: bestBank,
    };
  }

  // =========================================================
  // ==================  EXPORT CSV  ==================
  // =========================================================

  async exportToCsv(userId: number, filters: ExportQueryDto): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const fullName = user ? `${user.firstName} ${user.lastName}` : 'Inconnu';

    const where: FindOptionsWhere<Expense> = { user: { id: userId } };

    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.category = { id: filters.categoryId };

    if (filters.dateFrom && filters.dateTo) {
      where.date = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      ) as any;
    }

    const expenses = await this.expenseRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });

    const BOM = '\uFEFF';

    const userLine = `"Exporté par : ${this.sanitizeCsvField(fullName)}"`;
    const dateLine = `"Date d'export : ${new Date().toLocaleDateString('fr-FR')}"`;

    const headers = [
      'Date',
      'Libellé',
      'Type',
      'Montant (€)',
      'Catégorie',
    ].join(';');

    const rows = expenses.map((e) => {
      const date = new Date(e.date).toLocaleDateString('fr-FR');
      const safeLabel = this.sanitizeCsvField(e.label).replace(/"/g, '""');
      const label = `"${safeLabel}"`;
      const type = e.type === 'expense' ? 'Dépense' : 'Revenu';
      const amount = Math.abs(Number(e.amount)).toFixed(2).replace('.', ',');
      const category = e.category
        ? `"${this.sanitizeCsvField(e.category.name).replace(/"/g, '""')}"`
        : 'Non catégorisé';
      return [date, label, type, amount, category].join(';');
    });

    const totalDepenses = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
    const totalRevenus = expenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const summary = [
      '',
      '"Total dépenses"',
      '',
      totalDepenses.toFixed(2).replace('.', ','),
      '',
    ].join(';');
    const summaryIncome = [
      '',
      '"Total revenus"',
      '',
      totalRevenus.toFixed(2).replace('.', ','),
      '',
    ].join(';');

    return (
      BOM +
      [
        userLine,
        dateLine,
        '',
        headers,
        ...rows,
        '',
        summary,
        summaryIncome,
      ].join('\n')
    );
  }
}
