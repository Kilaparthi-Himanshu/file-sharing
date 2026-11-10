import { Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";

import { SessionsService } from "./sessions.service";

@Controller('sessions')
export class SessionsController {
    constructor(
        private readonly sessionsService: SessionsService,
    ) {}

    @Post()
    createSession() {
        return this.sessionsService.createSession();
    }

    @Get(':sessionId')
    getSession(
        @Param('sessionId', new ParseUUIDPipe())
        sessionId: string,
    ) {
        return this.sessionsService.getSession(sessionId);
    }
}
