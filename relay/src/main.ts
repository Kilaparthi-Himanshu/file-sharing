import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

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

    app.enableShutdownHooks();

    await app.listen(port, '0.0.0.0');
}

void bootstrap();
