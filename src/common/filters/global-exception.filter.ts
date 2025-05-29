import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { WhisperTranscriptionException } from '@/modules/whisper/exceptions/whisper-transcription.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDev =
      process.env.NODE_ENV === 'development' ||
      process.env.SHOW_ERROR_MESSAGE === 'true';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (true) {
      case exception instanceof HttpException:
        status = exception.getStatus();
        message = this.extractHttpMessage(exception);
        break;
      case exception instanceof WhisperTranscriptionException:
        status = 502;
        message = exception.message;
        break;
      case exception instanceof Error:
        message = exception.message;
        break;
      default:
        message = String(exception);
        break;
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isDev && { message }),
    };

    this.logger.error(
      `Status: ${String(status)} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(responseBody);
  }

  private extractHttpMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && 'message' in response) {
      const msg = (response as { message: string | string[] }).message;
      return Array.isArray(msg) ? msg.join('; ') : msg;
    }
    return exception.message;
  }
}