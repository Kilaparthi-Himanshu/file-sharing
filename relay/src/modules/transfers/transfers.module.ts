import { Module } from "@nestjs/common";

import { SessionsModule } from "./sessions/sessions.module";
import { ParticipantsModule } from "./participants/participants.module";
import { TransfersController } from "./transfers.controller";
import { TransfersService } from "./transfers.service";
import { FilesModule } from "./files/files.module";
import { DeliveriesModule } from './deliveries/deliveries.module';
import { StreamConnectionsModule } from './stream-connections/stream-connections.module';

@Module({
    imports: [
        SessionsModule,
        ParticipantsModule,
        FilesModule,
        DeliveriesModule,
        StreamConnectionsModule
    ],
    controllers: [
        TransfersController,
    ],
    providers: [
        TransfersService,
    ],
    exports: [
        TransfersService,
        StreamConnectionsModule,
    ],
})
export class TransfersModule {}
