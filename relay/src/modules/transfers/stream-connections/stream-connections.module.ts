import { Module } from '@nestjs/common';

import { STREAM_CONNECTIONS_REPOSITORY } from './stream-connections.repository';
import { InMemoryStreamConnectionsRepository } from './in-memory-stream-connections.repository';

@Module({
    providers: [
        InMemoryStreamConnectionsRepository,
        {
            provide: STREAM_CONNECTIONS_REPOSITORY,
            useExisting: InMemoryStreamConnectionsRepository,
        },
    ],
    exports: [
        STREAM_CONNECTIONS_REPOSITORY,
    ],
})
export class StreamConnectionsModule {}
