import { Module } from '@nestjs/common';

import { SessionsModule } from '../sessions/sessions.module';
import { ParticipantsModule } from '../participants/participants.module';
import { FilesModule } from '../files/files.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';

import { STREAM_CONNECTIONS_REPOSITORY } from './stream-connections.repository';
import { InMemoryStreamConnectionsRepository } from './in-memory-stream-connections.repository';
import { StreamConnectionsService } from './stream-connections.service';

@Module({
    imports: [
        SessionsModule,
        ParticipantsModule,
        FilesModule,
        DeliveriesModule,
    ],
    providers: [
        InMemoryStreamConnectionsRepository,
        {
            provide: STREAM_CONNECTIONS_REPOSITORY,
            useExisting: InMemoryStreamConnectionsRepository,
        },
        StreamConnectionsService,
    ],
    exports: [STREAM_CONNECTIONS_REPOSITORY, StreamConnectionsService],
})
export class StreamConnectionsModule {}
