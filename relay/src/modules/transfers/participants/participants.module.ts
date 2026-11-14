import { Module } from "@nestjs/common";
import { SessionsModule } from "../sessions/sessions.module";
import { ParticipantsService } from "./participants.service";
import { InMemoryParticipantsRepository } from "./in-memory-participants.repository";
import { PARTICIPANTS_REPOSITORY } from "./participants.repository";

@Module({
    imports: [SessionsModule],
    providers: [
        ParticipantsService,
        InMemoryParticipantsRepository,
        {
            provide: PARTICIPANTS_REPOSITORY,
            useExisting: InMemoryParticipantsRepository,
        }
    ],
    exports: [ParticipantsService],
})
export class ParticipantsModule {}
