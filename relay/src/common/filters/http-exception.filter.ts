import  {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

import type { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';

interface ErrorResponse {
    statusCode: number,
    timestamp: string;
    path: string;
    method: string;
    message: string | string[];
    requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();

        const request = context.getRequest<FastifyRequest>();
        const reply = context.getResponse<FastifyReply>();

        const isHttpException = exception instanceof HttpException;

        const statusCode = isHttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = this.getSafeMessage(exception);

        const requestId = String(request.id ?? 'unknown');

        const response: ErrorResponse = {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            requestId,
        }

        const logContext = {
            requestId,
            method: request.method,
            url: request.url,
            statusCode,
            err: exception,
        }

        if (statusCode >= 500) {
            this.logger.error(logContext, 'Unhandled server exception');
        } else {
            this.logger.warn(logContext, 'HTTP request failed');
        }

        if (reply.sent) {
            return;
        }

        reply.status(statusCode).send(response);
    }

    private getSafeMessage(exception: unknown): string | string[] {
        if (!(exception instanceof HttpException)) {
            return 'Internal server error';
        }

        const exceptionResponse = exception.getResponse();

        if (typeof exceptionResponse === 'string') {
            return exceptionResponse;
        }

        if (
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
        ) {
            const message = exceptionResponse.message;

            if (
                typeof message === 'string' ||
                (Array.isArray(message) &&
                message.every((item) => typeof item === 'string'))
            ) {
                return message;
            }
        }

        return exception.message;
    }
}
