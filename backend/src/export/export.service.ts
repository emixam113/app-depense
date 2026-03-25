import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Expense } from '../expense/entity/expense.entity';
import { ExportQueryDto } from './dto/export-query.dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async exportToCsv(userId: number, filters: ExportQueryDto): Promise<string> {
    const where: FindOptionsWhere<Expense> = {
      user: { id: userId },
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.category = { id: filters.categoryId };
    }

    if (filters.dateFrom && filters.dateTo) {
      where.date = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      ) as any;
    } else if (filters.dateFrom) {
      where.date = Between(
        new Date(filters.dateFrom),
        new Date('9999-12-31'),
      ) as any;
    } else if (filters.dateTo) {
      where.date = Between(
        new Date('1970-01-01'),
        new Date(filters.dateTo),
      ) as any;
    }

    const expenses = await this.expenseRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });

    // ✅ BOM UTF-8 pour Excel
    const BOM = '\uFEFF';

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

    return BOM + [headers, ...rows, '', summary, summaryIncome].join('\n');
  }
}
