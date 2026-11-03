import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import type { Request, Response } from 'express';
  import { STATUS_CODES } from 'node:http';
  
  interface ErrorResponseBody {
    statusCode: number;
    error: string;
    message: string;
    correlationId: string;
  }
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
      const correlationId = request.correlationId ?? 'unknown';
  
      const body = this.buildBody(exception, correlationId);
  
      if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `[${correlationId}] ${exception instanceof Error ? exception.stack : String(exception)}`,
        );
      }
  
      response.status(body.statusCode).json(body);
    }
  
    private buildBody(exception: unknown, correlationId: string): ErrorResponseBody {
      if (exception instanceof HttpException) {
        const statusCode = exception.getStatus();
        const payload = exception.getResponse();
  
        if (typeof payload === 'string') {
          return {
            statusCode,
            error: STATUS_CODES[statusCode] ?? 'Error',
            message: payload,
            correlationId,
          };
        }
  
        const { error, message } = payload as { error?: string; message?: string | string[] };
        return {
          statusCode,
          error: error ?? STATUS_CODES[statusCode] ?? 'Error',
          message: Array.isArray(message) ? message.join('; ') : (message ?? exception.message),
          correlationId,
        };
      }
  
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Ha ocurrido un error inesperado',
        correlationId,
      };
    }
  }