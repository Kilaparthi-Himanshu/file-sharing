import { Module } from '@nestjs/common';

import { SessionsModule } from '../sessions/sessions.module';
import { ParticipantsModule } from '../participants/participants.module';
import { FilesModule } from '../files/files.module';

import { DELIVERIES_REPOSITORY } from './deliveries.repository';
import { InMemoryDeliveriesRepository } from './in-memory-deliveries.repository';
import { DeliveriesService } from './deliveries.service';

@Module({
    imports: [
        SessionsModule,
        ParticipantsModule,
        FilesModule,
    ],
    providers: [
        InMemoryDeliveriesRepository,
        {
            provide: DELIVERIES_REPOSITORY,
            useExisting: InMemoryDeliveriesRepository,
        },
        DeliveriesService
    ],
    exports: [
        DELIVERIES_REPOSITORY,
        DeliveriesService,
    ],
})
export class DeliveriesModule {}
