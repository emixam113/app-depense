import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'Le fichier dépasse la taille maximale autorisée.',
      });
    }

    return res.status(400).json({
      message: exception.message || 'Erreur lors du traitement du fichier.',
    });
  }
}
