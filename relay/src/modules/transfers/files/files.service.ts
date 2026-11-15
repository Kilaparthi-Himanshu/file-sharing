import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FILE_UPLOAD_TRANSITIONS, transitionState } from '../domain';

import type { FileTransfer, TransferSession } from '../domain';

import { SessionsService } from '../sessions/sessions.service';
import { ParticipantsService } from '../participants/participants.service';

import { FILES_REPOSITORY } from './files.repository';

import type { FilesRepository } from './files.repository';

export interface AnnounceFileInput {
    name: string;
    size: number;
    mimeType: string;
}

@Injectable()
export class FilesService {
    constructor(
        @Inject(FILES_REPOSITORY)
        private readonly repository: FilesRepository,
        
        private readonly sessionsService: SessionsService,

        private readonly participantsService: ParticipantsService,
    ) {}

    private async getAuthorizedSender(sessionId: string, senderParticipantId: string): Promise<TransferSession> {
        const session = await this.sessionsService.getSession(sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot modify files in an inactive session');
        }

        const participant = await this.participantsService.getParticipant(senderParticipantId);

        if (
            participant.sessionId !== sessionId ||
            participant.role !== 'sender' ||
            !participant.permissions.canSend
        ) {
            throw new ForbiddenException('Only the designated sender can perform this operation');
        }

        if (participant.status !== 'active') {
            throw new ForbiddenException('The sender participant is not active');
        }

        if (session.senderParticipantId !== senderParticipantId) {
            throw new ForbiddenException('Participant is not the designated sender');
        }

        return session;
    }

    async announceFile(sessionId: string, senderParticipantId: string, input: AnnounceFileInput): Promise<FileTransfer> {
        await this.getAuthorizedSender(sessionId, senderParticipantId);

        if (!input.name?.trim()) {
            throw new BadRequestException('File name is required');
        }

        if (!Number.isSafeInteger(input.size) || input.size <= 0) {
            throw new BadRequestException('File size must be a positive safe integer');
        }

        if (!input.mimeType.trim()) {
            throw new BadRequestException('File MIME type is required');
        }

        const now = new Date();

        const file: FileTransfer = {
            id: randomUUID(),
            sessionId,
            senderId: senderParticipantId,
            name: input.name.trim(),
            size: input.size,
            mimeType: input.mimeType.trim(),
            uploadStatus: 'announced',
            createdAt: now,
            updatedAt: now,
        }

        return this.repository.create(file);
    }

    async getFile(fileId: string): Promise<FileTransfer> {
        const file = await this.repository.findById(fileId);

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    async getSessionFiles(sessionId: string, senderParticipantId: string): Promise<FileTransfer[]> {
        await this.getAuthorizedSender(sessionId, senderParticipantId);

        return this.repository.findBySessionId(sessionId);
    }

    async getAvailableFilesForReceiver(sessionId: string, receiverParticipantId: string): Promise<FileTransfer[]> {
        const session = await this.sessionsService.getSession(sessionId);

        const receiver = await this.participantsService.getParticipant(receiverParticipantId);

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

        if (session.status !== 'active') {
            throw new BadRequestException('Session is not active');
        }

        const files = await this.repository.findBySessionId(sessionId);

        return files.filter(
            (file) => file.uploadStatus === 'available',
        );
    }

    async startUpload(fileId: string, senderParticipantId: string): Promise<FileTransfer> {
        const file = await this.getFile(fileId);

        await this.getAuthorizedSender(file.sessionId, senderParticipantId);

        if (file.senderId !== senderParticipantId) {
            throw new ForbiddenException('Sender does not own this file');
        }

        file.uploadStatus = transitionState(
            'FileTransfer',
            file.uploadStatus,
            'uploading',
            FILE_UPLOAD_TRANSITIONS,
        );

        file.updatedAt = new Date();

        return this.repository.update(file);
    }

    async completeUpload(fileId: string, senderParticipantId: string): Promise<FileTransfer> {
        const file = await this.getFile(fileId);

        await this.getAuthorizedSender(file.sessionId, senderParticipantId);

        if (file.senderId !== senderParticipantId) {
            throw new ForbiddenException('Sender does not own this file');
        }

        file.uploadStatus = transitionState(
            'FileTransfer',
            file.uploadStatus,
            'available',
            FILE_UPLOAD_TRANSITIONS
        );

        const now = new Date();

        file.updatedAt = now;
        file.uploadedAt = now;

        return this.repository.update(file);
    }

    async failUpload(fileId: string, senderParticipantId: string): Promise<FileTransfer> {
        const file = await this.getFile(fileId);

        await this.getAuthorizedSender(file.sessionId, senderParticipantId);

        if (file.senderId !== senderParticipantId) {
            throw new ForbiddenException('Sender does not own this file');
        }

        file.uploadStatus = transitionState(
            'FileTransfer',
            file.uploadStatus,
            'failed',
            FILE_UPLOAD_TRANSITIONS
        );

        file.updatedAt = new Date();

        return this.repository.update(file);
    }

    async cancelFile(fileId: string, senderParticipantId: string): Promise<FileTransfer> {
        const file = await this.getFile(fileId);

        await this.getAuthorizedSender( file.sessionId, senderParticipantId);

        if (file.senderId !== senderParticipantId) {
            throw new ForbiddenException('Sender does not own this file');
        }

        file.uploadStatus = transitionState(
            'FileTransfer',
            file.uploadStatus,
            'cancelled',
            FILE_UPLOAD_TRANSITIONS,
        );

        file.updatedAt = new Date();

        return this.repository.update(file);
    }
}
