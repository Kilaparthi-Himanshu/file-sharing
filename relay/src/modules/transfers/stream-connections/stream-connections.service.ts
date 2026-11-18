import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import type { FileDelivery, FileTransfer, Participant, StreamConnection } from '../domain';

import { SessionsService } from '../sessions/sessions.service';
import { ParticipantsService } from '../participants/participants.service';
import { FilesService } from '../files/files.service';
import { DeliveriesService } from '../deliveries/deliveries.service';

import { STREAM_CONNECTIONS_REPOSITORY } from './stream-connections.repository';

import type { StreamConnectionsRepository } from './stream-connections.repository';

@Injectable()
export class StreamConnectionsService {
    constructor(
        @Inject(STREAM_CONNECTIONS_REPOSITORY)
        private readonly repository: StreamConnectionsRepository,

        private readonly sessionsService: SessionsService,

        private readonly participantsService: ParticipantsService,

        private readonly filesService: FilesService,

        private readonly deliveriesService: DeliveriesService,
    ) {}

    private async getActiveParticipant(sessionId: string, participantId: string): Promise<Participant> {
        const session = await this.sessionsService.getSession(sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot open streams for an inactive session');
        }

        const participant = await this.participantsService.getParticipant(participantId);

        if (participant.sessionId !== sessionId) {
            throw new ForbiddenException('Participant does not belong to this session');
        }

        if (participant.status !== 'active') {
            throw new ForbiddenException('Participant is not active');
        }

        return participant;
    }

    async createUploadConnection(sessionId: string, fileId: string, senderId: string): Promise<StreamConnection> {
        const [participant, file] = await Promise.all([
            this.getActiveParticipant(sessionId, senderId),
            this.filesService.getFile(fileId),
        ]);

        if (
            participant.role !== 'sender' ||
            !participant.permissions.canSend ||
            participant.id !== ((await this.sessionsService.getSession(sessionId)).senderParticipantId)
        ) {
            throw new ForbiddenException('Participant is not authorized to upload files');
        }

        if (file.sessionId !== sessionId || file.senderId !== senderId) {
            throw new ForbiddenException('File does not belong to this sender and session');
        }

        if (file.uploadStatus !== 'announced') {
            throw new ConflictException('File is not ready for an upload connection');
        }

        const existingConnections = await this.repository.findByFileId(fileId);

        const hasActiveUpload = existingConnections.some(
            (connection) => 
                connection.direction === 'upload' &&
                (connection.status === 'opening' || connection.status === 'active'),
        );

        if (hasActiveUpload) {
            throw new ConflictException('An upload connection already exists for this file');
        }

        const connection: StreamConnection = {
            id: randomUUID(),
            sessionId,
            fileId,
            participantId: senderId,
            direction: 'upload',
            status: 'opening',
            bytesTransferred: 0,
            openedAt: new Date(),
        }

        return this.repository.create(connection);
    }

    async createDownloadConnection(deliveryId: string, receiverId: string): Promise<StreamConnection> {
        const delivery: FileDelivery = await this.deliveriesService.getDelivery(deliveryId);

        const [participant, file] = await Promise.all([
            this.getActiveParticipant(delivery.senderId, receiverId),
            this.filesService.getFile(delivery.fileId),
        ]);

        if (
            participant.role !== 'receiver' ||
            !participant.permissions.canReceive ||
            delivery.receiverId !== receiverId
        ) {
            throw new ForbiddenException('Participant is not authorized for this download');
        }

        if (
            file.sessionId !== delivery.sessionId ||
            file.id !== delivery.fileId ||
            file.uploadStatus !== 'available'
        ) {
            throw new BadRequestException('File is not available for download');
        }

        if (delivery.status !== 'pending' && delivery.status !== 'streaming') {
            throw new ConflictException('Delivery is no longer available');
        }

        const connection: StreamConnection = {
            id: randomUUID(),
            sessionId: delivery.sessionId,
            fileId: delivery.fileId,
            participantId: receiverId,
            deliveryId: delivery.id,
            direction: 'download',
            status: 'opening',
            bytesTransferred: 0,
            openedAt: new Date(),
        }

        return this.repository.create(connection);
    }
}
