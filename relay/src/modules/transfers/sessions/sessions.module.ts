import { Module } from "@nestjs/common";

import { SessionsService } from "./sessions.service";
import { InMemorySessionsRepository } from "./in-memory-sessions.repository";
import { SESSIONS_REPOSITORY } from "./sessions.repository";

import { SessionsController } from "./sessions.controller";

@Module({
    controllers: [SessionsController],
    providers: [
        SessionsService,
        InMemorySessionsRepository,
        {
            provide: SESSIONS_REPOSITORY,
            useExisting: InMemorySessionsRepository,
        },
    ],
    exports: [SessionsService],
})
export class SessionsModule {}
