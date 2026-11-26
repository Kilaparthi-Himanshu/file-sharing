import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { FILE_DELIVERY_TRANSITIONS, transitionState } from '../domain';

import type { FileDelivery, Participant } from '../domain';

import { SessionsService } from '../sessions/sessions.service';
import { ParticipantsService } from '../participants/participants.service';
import { FilesService } from '../files/files.service';

import { DELIVERIES_REPOSITORY } from './deliveries.repository';

import type { DeliveriesRepository } from './deliveries.repository';

@Injectable()
export class DeliveriesService {
    constructor(
        @Inject(DELIVERIES_REPOSITORY)
        private readonly repository: DeliveriesRepository,
        
        private readonly sessionsService: SessionsService,

        private readonly participantsService: ParticipantsService,

        private readonly filesService: FilesService,
    ) {}

    private async getAuthorizedReceiver(sessionId: string, receiverId: string): Promise<Participant> {
        const session = await this.sessionsService.getSession(sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot download files from an inactive session');
        }

        const receiver = await this.participantsService.getParticipant(receiverId);

        if (
            receiver.sessionId !== sessionId ||
            receiver.role !== 'receiver' ||
            !receiver.permissions.canReceive
        ) {
            throw new ForbiddenException('Participant is not an authorized receiver');
        }

        if (receiver.status !== 'active') {
            throw new ForbiddenException('Receiver participant is not active');
        }

        return receiver;
    }

    private async getAuthorizedDelivery(deliveryId: string, receiverId: string): Promise<FileDelivery> {
        const delivery = await this.getDelivery(deliveryId);

        if (delivery.receiverId !== receiverId) {
            throw new ForbiddenException('This delivery does not belong to the receiver');
        }

        await this.getAuthorizedReceiver(delivery.sessionId, receiverId);

        return delivery;
    }

    async createDelivery(fileId: string, receiverId: string): Promise<FileDelivery> {
        const file = await this.filesService.getFile(fileId);

        await this.getAuthorizedReceiver(file.sessionId, receiverId);

        if (file.uploadStatus !== 'available') {
            throw new BadRequestException('File is not available for download');
        }

        const existingDelivery = await this.repository.findByFileAndReceiver(fileId, receiverId);

        if (existingDelivery) {
            if (
                existingDelivery.status === 'pending' ||
                existingDelivery.status === 'streaming'
            ) {
                return existingDelivery;
            }

            if (
                existingDelivery.status === 'completed' ||
                existingDelivery.status === 'cancelled'
            ) {
                throw new ConflictException(
                    'This receiver has already completed or cancelled this delivery',
                );
            }

            // A failed delivery can be retried as a new attempt.
        }

        const now = new Date();

        const delivery: FileDelivery = {
            id: randomUUID(),
            fileId: file.id,
            sessionId: file.sessionId,
            senderId: file.senderId,
            receiverId,
            status: 'pending',
            bytesSent: 0,
            updatedAt: now,
        }

        return this.repository.create(delivery);
    }

    async getDelivery(deliveryId: string): Promise<FileDelivery> {
        const delivery = await this.repository.findById(deliveryId);

        if (!delivery) {
            throw new NotFoundException('File delivery not found');
        }

        return delivery;
    }

    async getReceiverDeliveries(receiverId: string): Promise<FileDelivery[]> {
        const receiver = await this.participantsService.getParticipant(receiverId);

        if (
            receiver.role !== 'receiver' ||
            !receiver.permissions.canReceive
        ) {
            throw new ForbiddenException('Participant is not an authorized receiver');
        }

        return this.repository.findByReceiverId(receiverId);
    }

    async getFileDeliveries(fileId: string, senderId: string): Promise<FileDelivery[]> {
        const file = await this.filesService.getFile(fileId);

        // Reuse the sender authorization rules from FilesService.
        await this.filesService.getSessionFiles(file.sessionId, senderId);

        if (file.senderId !== senderId) {
            throw new ForbiddenException('Sender does not own this file');
        }

        return this.repository.findByFileId(fileId);
    }

    async startDelivery(deliveryId: string, receiverId: string): Promise<FileDelivery> {
        const delivery = await this.getAuthorizedDelivery(deliveryId, receiverId);

        delivery.status = transitionState(
            'FileDelivery',
            delivery.status,
            'streaming',
            FILE_DELIVERY_TRANSITIONS,
        );

        const now = new Date();

        delivery.startedAt = now;
        delivery.updatedAt = now;

        return this.repository.update(delivery);
    }

    async updateProgress(deliveryId: string, receiverId: string, bytesSent: number): Promise<FileDelivery> {
        const delivery = await this.getAuthorizedDelivery(deliveryId, receiverId);

        if (delivery.status !== 'streaming') {
            throw new BadRequestException('Progress can only be updated for an active delivery');
        }

        const file = await this.filesService.getFile(delivery.fileId);

        if (
            !Number.isSafeInteger(bytesSent) ||
            bytesSent < delivery.bytesSent ||
            bytesSent > file.size
        ) {
            throw new BadRequestException('Invalid delivery progress');
        }

        delivery.bytesSent = bytesSent;
        delivery.updatedAt = new Date();

        return this.repository.update(delivery);
    }

    async completeDelivery(deliveryId: string, receiverId: string): Promise<FileDelivery> {
        const delivery = await this.getAuthorizedDelivery(deliveryId, receiverId);

        const file = await this.filesService.getFile(delivery.fileId);

        if (delivery.bytesSent !== file.size) {
            throw new BadRequestException('Cannot complete delivery before the entire file is transferred');
        }

        delivery.status = transitionState(
            'FileDelivery',
            delivery.status,
            'completed',
            FILE_DELIVERY_TRANSITIONS,
        );

        const now = new Date();

        delivery.completedAt = now;
        delivery.updatedAt = now;

        return this.repository.update(delivery);
    }

    async cancelDelivery(deliveryId: string, receiverId: string): Promise<FileDelivery> {
        const delivery = await this.getAuthorizedDelivery(deliveryId, receiverId);

        delivery.status = transitionState(
            'FileDelivery',
            delivery.status,
            'cancelled',
            FILE_DELIVERY_TRANSITIONS,
        );

        delivery.updatedAt = new Date();

        return this.repository.update(delivery);
    }

    async failDelivery(deliveryId: string, receiverId: string): Promise<FileDelivery> {
        const delivery = await this.getAuthorizedDelivery(deliveryId, receiverId);

        delivery.status = transitionState(
            'FileDelivery',
            delivery.status,
            'failed',
            FILE_DELIVERY_TRANSITIONS,
        );

        delivery.updatedAt = new Date();

        return this.repository.update(delivery);
    }
}
