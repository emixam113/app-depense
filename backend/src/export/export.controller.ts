import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // --- EXPORT (Reste inchangé + Gardien Premium) ---
  @Get('csv')
  async exportCsv(
    @Req() req: Request,
    @Res() res: Response,
    @Query() filters: ExportQueryDto,
  ) {
    if (!req.user['isPremium']) {
      throw new ForbiddenException(
        "L'export CSV est une fonctionnalité Premium. Passez à la version supérieure pour en profiter !",
      );
    }

    const csv = await this.exportService.exportToCsv(req.user['id'], filters);

    const filename = `export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csv);
  }

  // --- NOUVEL IMPORT (Accessible à tous) ---
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new ForbiddenException("Aucun fichier n'a été transmis.");
    }
    // Conversion du buffer en string UTF-8 pour le traitement
    const content = file.buffer.toString('utf-8');
    return this.exportService.importFromCsv(req.user['id'], content);
  }
}
