import type, { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

export const loggerConfig: Params = {
    pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",

        genReqId: () => randomUUID(),

        autoLogging: true,

        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-api-key"]',
            ],
            censor: '[REDACTED]',
        },

        transport:
            process.env.NODE_ENV !== 'production'
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        singleLine: false,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname'
                    },
                }
                : undefined,
    },
}
