import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from '@fastify/helmet';

import { GlobalValidationPipe } from './common/pipes/validation.pipe';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
        {
            bufferLogs: true,
        }
    );

    app.useLogger(app.get(Logger));
    app.useGlobalPipes(GlobalValidationPipe);

    const configService = app.get(ConfigService);

    const port = configService.get<number>('PORT', 3001);

    const allowedOrigins = configService
        .get<string>('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-request-ID'
        ],
        credentials: true,
        maxAge: 86400,
    });

    await app.register(helmet, {
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        },
    });

    app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

    await app.listen(port, '0.0.0.0');
}

void bootstrap();
