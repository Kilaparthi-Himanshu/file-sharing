import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { Logger, LoggerModule } from 'nestjs-pino';

import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
