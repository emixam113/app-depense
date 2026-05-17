import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Expense } from '../expense/entity/expense.entity';
import { User } from '../user/entity/user.entity';
import { ExportQueryDto } from './dto/export-query.dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // --- LOGIQUE D'IMPORTATION (Nouveau) ---
  async importFromCsv(userId: number, fileContent: string): Promise<any> {
    const lines = fileContent.split('\n');
    const detectedSubscriptions = [];
    const expensesToSave = [];

    // On boucle sur les lignes (on saute l'en-tête à i=0 si besoin)
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(';');
      if (columns.length < 3) continue;

      const [dateRaw, labelRaw, amountRaw] = columns;

      // Nettoyage du montant et du libellé
      const amount = parseFloat(amountRaw.replace(',', '.').trim());
      let label = labelRaw.replace(/"/g, '').trim();

      // Détection automatique d'abonnement (Netflix, etc.)
      let isRecurring = false;
      const upperLabel = label.toUpperCase();

      if (upperLabel.includes('NETFLIX')) {
        label = 'Netflix';
        isRecurring = true;
      } else if (upperLabel.includes('SPOTIFY')) {
        label = 'Spotify';
        isRecurring = true;
      }

      // Conversion de la date JJ/MM/AAAA vers Date JS
      const parts = dateRaw.split('/');
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

      if (isNaN(date.getTime())) continue;

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

    // Sauvegarde en masse pour la performance
    await this.expenseRepository.save(expensesToSave);

    return {
      success: true,
      count: expensesToSave.length,
      subscriptions: detectedSubscriptions,
    };
  }

  // --- TON CODE D'EXPORT (Conservé tel quel) ---
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

    // ... calcul des totaux et retour (ta logique actuelle)
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
