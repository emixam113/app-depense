import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('csv')
  async exportCsv(
    @Req() req: Request,
    @Res() res: Response,
    @Query() filters: ExportQueryDto,
  ) {
    const csv = await this.exportService.exportToCsv(req.user['id'], filters);

    const dateRange =
      filters.dateFrom && filters.dateTo
        ? `_${filters.dateFrom}_au_${filters.dateTo}`
        : '';
    const typeLabel = filters.type
      ? `_${filters.type === 'expense' ? 'depenses' : 'revenus'}`
      : '';
    const filename = `export${typeLabel}${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
