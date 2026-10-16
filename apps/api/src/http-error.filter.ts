import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
      response.status(413).json({ statusCode: 413, message: 'Слишком большой запрос' });
      return;
    }
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json({ statusCode: error.getStatus(), message: error.message });
      return;
    }
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    const unavailable = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '57P01', '57P02', '57P03', '53300', '57014', '08006'].includes(code)
      || (error instanceof Error && /connection|timeout|terminat/i.test(error.message));
    const statusCode = unavailable ? 503 : 500;
    Logger.error(`Request failed: status=${statusCode} code=${code || 'unknown'}`, 'HTTP');
    response.status(statusCode).json({ statusCode, message: unavailable ? 'Хранилище временно недоступно' : 'Не удалось выполнить запрос' });
  }
}
