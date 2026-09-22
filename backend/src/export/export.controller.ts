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
// Pas d'import statique : file-type v17+ est ESM-only (corrige un CVE présent
// dans les versions <17, ex. CVE-2026-31808). On charge le module dynamiquement
// pour rester compatible avec un projet NestJS en CommonJS.
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

  // --- IMPORT CSV (Accessible à tous) ---
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        // Limite raisonnable pour un CSV de relevé de dépenses.
        // À ajuster si tes utilisateurs importent des historiques très longs.
        fileSize: 2 * 1024 * 1024, // 2 Mo max
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new ForbiddenException('Seuls les fichiers CSV sont autorisés.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
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

  // --- IMPORT PDF SÉCURISÉ ---
  @Post('import-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Limite à 5 Mo max pour un relevé bancaire
      },
      fileFilter: (req, file, callback) => {
        // Premier filtre rapide sur le mimetype déclaré (pas suffisant seul,
        // mais évite de traiter des fichiers manifestement hors sujet avant
        // même de les charger en mémoire). La vérification qui fait foi
        // (magic bytes) est faite plus bas, une fois le fichier reçu.
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new ForbiddenException('Seuls les fichiers PDF sont autorisés.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async importPdf(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new ForbiddenException("Aucun fichier n'a été transmis.");
    }

    // Vérification du contenu binaire réel : le mimetype déclaré par le
    // client est falsifiable, ceci ne l'est pas (lecture des magic bytes).
    // Import dynamique car file-type est en pur ESM depuis la v17
    // (nécessaire pour bénéficier du correctif de sécurité de la v21).
    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (!detectedType || detectedType.mime !== 'application/pdf') {
      throw new ForbiddenException(
        "Le fichier fourni n'est pas un PDF valide.",
      );
    }

    return this.exportService.importFromPDF(req.user['id'], file.buffer);
  }
}
