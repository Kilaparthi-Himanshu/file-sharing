import { Module } from "@nestjs/common";

import { SessionsModule } from "./sessions/sessions.module";
import { ParticipantsModule } from "./participants/participants.module";
import { TransfersController } from "./transfers.controller";
import { TransfersService } from "./transfers.service";

@Module({
    imports: [
        SessionsModule,
        ParticipantsModule
    ],
    controllers: [
        TransfersController,
    ],
    providers: [
        TransfersService,
    ],
    exports: [
        TransfersService,
    ],
})
export class TransfersModule {}
