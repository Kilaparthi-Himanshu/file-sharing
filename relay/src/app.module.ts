import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from 'nestjs-pino';

import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './modules/health/health.module';
import { TransfersModule } from './modules/transfers/transfers.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validationSchema: envValidationSchema,
            validationOptions: {
                libraryOptions: {
                    allowUnknown: true,
                    abortEarly: false,
                }
            },
        }),

        LoggerModule.forRoot(loggerConfig),

        HealthModule,

        TransfersModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        }
    ],
})
export class AppModule {}
