import { Module } from "@nestjs/common";
import { InMemoryFilesRepository } from "./in-memory-files.repository";
import { FILES_REPOSITORY } from "./files.repository";
import { SessionsModule } from "../sessions/sessions.module";
import { ParticipantsModule } from "../participants/participants.module";
import { FilesService } from "./files.service";

@Module({
    imports: [
        SessionsModule,
        ParticipantsModule,
    ],
    providers: [
        InMemoryFilesRepository,
        {
            provide: FILES_REPOSITORY,
            useExisting: InMemoryFilesRepository
        },
        FilesService
    ],
    exports: [
        FILES_REPOSITORY,
        FilesService
    ],
})
export class FilesModule {}
