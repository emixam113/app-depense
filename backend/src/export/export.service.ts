import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Expense } from '../expense/entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { ExportQueryDto } from './dto/export-query.dto';
import {join} from "path";

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async importFromCsv(userId: number, fileContent: string): Promise<any> {
    if (!fileContent || typeof fileContent !== 'string') {
      throw new Error('Le fichier est vide ou invalide');
    }

    const lines = fileContent
      .split(/\r?\n/)
      .filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error('Le fichier CSV ne contient aucune donnée à analyser');
    }

    if (lines.length > 5001) {
      throw new Error('Le fichier CSV dépasse la limite de 5000 lignes');
    }

    const headerLine = lines[0];
    const separator = headerLine.includes(';') ? ';' : ',';
    const dataLines = lines.slice(1);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const imported: Expense[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const cols = dataLines[i]
        .split(separator)
        .map((c) => c.replace(/^"|"$/g, '').trim());

      // Colonnes attendues : Date, Libellé, Type, Montant, Catégorie
      if (cols.length < 4) {
        errors.push(`Ligne ${i + 2} ignorée : colonnes insuffisantes`);
        continue;
      }

      const [dateStr, label, typeStr, amountStr] = cols;

      // Validation date
      const parts = dateStr.split('/');
      if (parts.length !== 3) {
        errors.push(`Ligne ${i + 2} ignorée : date invalide (${dateStr})`);
        continue;
      }
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (isNaN(date.getTime())) {
        errors.push(`Ligne ${i + 2} ignorée : date non parsable (${dateStr})`);
        continue;
      }

      // Validation type
      const type =
        typeStr === 'Dépense'
          ? 'expense'
          : typeStr === 'Revenu'
            ? 'income'
            : null;
      if (!type) {
        errors.push(`Ligne ${i + 2} ignorée : type invalide (${typeStr})`);
        continue;
      }

      // Validation montant
      const amount = parseFloat(amountStr.replace(',', '.'));
      if (isNaN(amount)) {
        errors.push(`Ligne ${i + 2} ignorée : montant invalide (${amountStr})`);
        continue;
      }

      // Validation label
      if (!label || label.length > 255) {
        errors.push(`Ligne ${i + 2} ignorée : libellé vide ou trop long`);
        continue;
      }

      const expense = this.expenseRepository.create({
        date,
        label,
        type,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        user,
      });

      imported.push(expense);
    }

    if (imported.length === 0) {
      throw new Error('Aucune ligne valide à importer');
    }

    await this.expenseRepository.save(imported);

    return {
      imported: imported.length,
      errors,
      message: `${imported.length} transaction(s) importée(s) avec succès`,
    };
  }


  // @ts-ignore
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
    const userLine = `"Exporté par : ${fullName}"`;
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
      const label = `"${e.label.replace(/"/g, '""')}"`;
      const type = e.type === 'expense' ? 'Dépense' : 'Revenu';
      const amount = Math.abs(Number(e.amount)).toFixed(2).replace('.', ',');
      const category = e.category ? `"${e.category.name}"` : 'Non catégorisé';
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