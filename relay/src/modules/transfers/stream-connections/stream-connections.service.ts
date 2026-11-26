import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import type { FileDelivery, FileTransfer, Participant, StreamConnection } from '../domain';

import { SessionsService } from '../sessions/sessions.service';
import { ParticipantsService } from '../participants/participants.service';
import { FilesService } from '../files/files.service';
import { DeliveriesService } from '../deliveries/deliveries.service';

import { STREAM_CONNECTIONS_REPOSITORY } from './stream-connections.repository';
import { STREAM_CONNECTION_TRANSITIONS, transitionState } from '../domain';

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
            this.getActiveParticipant(delivery.sessionId, receiverId),
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

        const existingConnections = await this.repository.findByFileId(
            delivery.fileId,
        );

        const hasActiveDownload = existingConnections.some(
            (connection) =>
                connection.direction === 'download' &&
                connection.deliveryId === delivery.id &&
                (connection.status === 'opening' || connection.status === 'active'),
        );

        if (hasActiveDownload) {
            throw new ConflictException('A download connection already exists for this delivery');
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

    private async getConnection(connectionId: string): Promise<StreamConnection> {
        const connection = await this.repository.findById(connectionId);

        if (!connection) {
            throw new NotFoundException('Stream connection not found');
        }

        return connection;
    }

    async activateConnection(connectionId: string): Promise<StreamConnection> {
        const connection = await this.getConnection(connectionId);

        if (connection.status !== 'opening') {
            throw new ConflictException('Stream connection is not in the opening state');
        }

        // Start the corresponding domain lifecycle before activating the connection.
        if (connection.direction === 'upload') {
            await this.filesService.startUpload(connection.fileId, connection.participantId);
        } else {
            if (!connection.deliveryId) {
                throw new BadRequestException('Download connection has no delivery ID');
            }

            await this.deliveriesService.startDelivery(connection.deliveryId, connection.participantId);
        }

        connection.status = transitionState(
            'StreamConnection',
            connection.status,
            'active',
            STREAM_CONNECTION_TRANSITIONS,
        );

        return this.repository.update(connection);
    }

    async updateProgress(connectionId: string, bytesTransferred: number): Promise<StreamConnection> {
        const connection = await this.getConnection(connectionId);

        if (connection.status !== 'active') {
            throw new ConflictException('Cannot update an inactive stream connection');
        }

        if (
            !Number.isSafeInteger(bytesTransferred) ||
            bytesTransferred < connection.bytesTransferred
        ) {
            throw new BadRequestException('Transferred bytes must be a safe integer and cannot decrease');
        }

        const file = await this.filesService.getFile(connection.fileId);

        if (bytesTransferred > file.size) {
            throw new BadRequestException('Transferred bytes cannot exceed the file size');
        }

        if (connection.direction === 'download') {
            if (!connection.deliveryId) {
                throw new BadRequestException('Download connection has no delivery ID');
            }

            await this.deliveriesService.updateProgress(
                connection.deliveryId,
                connection.participantId,
                bytesTransferred,
            );
        }

        connection.bytesTransferred = bytesTransferred;

        return this.repository.update(connection);
    }

    async completeConnection(connectionId: string): Promise<StreamConnection> {
        const connection = await this.getConnection(connectionId);

        if (connection.status !== 'active') {
            throw new ConflictException('Only active connections can be completed');
        }

        const file = await this.filesService.getFile(connection.fileId);

        if (connection.bytesTransferred !== file.size) {
            throw new BadRequestException('Cannot complete a connection before the entire file is transferred');
        }

        connection.status = transitionState(
            'StreamConnection',
            connection.status,
            'completed',
            STREAM_CONNECTION_TRANSITIONS,
        );

        connection.closedAt = new Date();

        const updatedConnection = await this.repository.update(connection);

        // Upload completion makes the file available to receivers.
        if (connection.direction === 'upload') {
            await this.filesService.completeUpload(
                connection.fileId,
                connection.participantId,
            );
        } else {
            if (!connection.deliveryId) {
                throw new BadRequestException('Download connection has no delivery ID');
            }

            await this.deliveriesService.completeDelivery(
                connection.deliveryId,
                connection.participantId,
            );
        }

        return updatedConnection;
    }

    async abortConnection(connectionId: string): Promise<StreamConnection> {
        const connection = await this.getConnection(connectionId);

        connection.status = transitionState(
            'StreamConnection',
            connection.status,
            'aborted',
            STREAM_CONNECTION_TRANSITIONS,
        );

        connection.closedAt = new Date();

        const updatedConnection = await this.repository.update(connection);

        if (connection.direction === 'upload') {
            await this.filesService.failUpload(connection.fileId, connection.participantId);
        } else {
            if (!connection.deliveryId) {
                throw new BadRequestException('Download connection has no delivery ID');
            }

            await this.deliveriesService.failDelivery(connection.deliveryId, connection.participantId);
        }

        return updatedConnection;
    }

    async failConnection(connectionId: string, reason: string): Promise<StreamConnection> {
        const connection = await this.getConnection(connectionId);

        if (!reason.trim()) {
            throw new BadRequestException('Failure reason is required');
        }

        connection.status = transitionState(
            'StreamConnection',
            connection.status,
            'failed',
            STREAM_CONNECTION_TRANSITIONS,
        );

        connection.failureReason = reason;
        connection.closedAt = new Date();

        const updatedConnection = await this.repository.update(connection);

        if (connection.direction === 'upload') {
            await this.filesService.failUpload(connection.fileId, connection.participantId);
        } else {
            if (!connection.deliveryId) {
                throw new BadRequestException('Download connection has no delivery ID');
            }

            await this.deliveriesService.failDelivery(connection.deliveryId, connection.participantId);
        }

        return updatedConnection;
    }
}
