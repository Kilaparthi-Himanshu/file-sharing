import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
    constructor(
        private readonly sessionsService: SessionsService,
    ) {}

    @Get(':sessionId')
    getSession(
        @Param('sessionId', new ParseUUIDPipe())
        sessionId: string,
    ) {
        return this.sessionsService.getSession(sessionId);
    }
}
