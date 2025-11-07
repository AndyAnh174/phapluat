import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Handle OAuth callback errors - redirect to frontend with error message
    if (request.url && request.url.includes('/auth/google/callback')) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      let errorMessage = 'Đăng nhập thất bại';
      
      if (exception instanceof Error) {
        const exceptionMessage = exception.message || '';
        // Check if it's an email domain error
        if (exceptionMessage.includes('HCMUTE') || exceptionMessage.includes('email')) {
          errorMessage = 'Tài khoản email của bạn không thuộc hệ thống HCMUTE. Vui lòng sử dụng tài khoản Google có đuôi @hcmute.edu.vn hoặc @student.hcmute.edu.vn để đăng nhập.';
        } else {
          errorMessage = exceptionMessage;
        }
      } else if (typeof message === 'string') {
        errorMessage = message;
      } else if (typeof message === 'object' && (message as any).message) {
        errorMessage = (message as any).message;
      }
      
      return response.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
    }

    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    // Only include stack trace in development
    if (isDevelopment && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Don't log passwords or sensitive data
    if (request.body?.password) {
      delete request.body.password;
    }

    response.status(status).json(errorResponse);
  }
}

