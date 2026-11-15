import {
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { SessionsService } from '../sessions/sessions.service';
import { InMemorySessionsRepository } from '../sessions/in-memory-sessions.repository';

import { ParticipantsService } from '../participants/participants.service';
import { InMemoryParticipantsRepository } from '../participants/in-memory-participants.repository';

import { InMemoryFilesRepository } from './in-memory-files.repository';
import { FilesService } from './files.service';

describe('FilesService', () => {
    let sessionsService: SessionsService;
    let participantsService: ParticipantsService;
    let filesService: FilesService;

    beforeEach(() => {
        sessionsService = new SessionsService(
            new InMemorySessionsRepository(),
        );

        participantsService = new ParticipantsService(
            new InMemoryParticipantsRepository(),
            sessionsService,
        );

        filesService = new FilesService(
            new InMemoryFilesRepository(),
            sessionsService,
            participantsService,
        );
    });

    async function createTransferWithParticipants() {
        const senderId = randomUUID();

        const session = await sessionsService.createSession(senderId);

        const sender = await participantsService.createSenderParticipant(
            session.id,
            senderId,
        );

        const receiver = await participantsService.createReceiverParticipant(
            session.id,
        );

        return { session, sender, receiver };
    }

    const fileInput = {
        name: 'document.pdf',
        size: 1024,
        mimeType: 'application/pdf',
    };

    describe('announceFile', () => {
        it('allows the designated sender to announce a file', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            expect(file.id).toBeDefined();
            expect(file.sessionId).toBe(session.id);
            expect(file.senderId).toBe(sender.id);
            expect(file.name).toBe(fileInput.name);
            expect(file.size).toBe(fileInput.size);
            expect(file.mimeType).toBe(fileInput.mimeType);
            expect(file.uploadStatus).toBe('announced');
        });

        it('allows the sender to announce multiple files', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            await filesService.announceFile(
                session.id,
                sender.id,
                {
                    name: 'image.png',
                    size: 2048,
                    mimeType: 'image/png',
                },
            );

            const files = await filesService.getSessionFiles(
                session.id,
                sender.id,
            );

            expect(files).toHaveLength(2);
        });

        it('rejects a receiver attempting to announce a file', async () => {
            const { session, receiver } =
                await createTransferWithParticipants();

            await expect(
                filesService.announceFile(
                    session.id,
                    receiver.id,
                    fileInput,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('rejects invalid file metadata', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            await expect(
                filesService.announceFile(
                    session.id,
                    sender.id,
                    { ...fileInput, name: '   ' },
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                filesService.announceFile(
                    session.id,
                    sender.id,
                    { ...fileInput, size: -1 },
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                filesService.announceFile(
                    session.id,
                    sender.id,
                    { ...fileInput, mimeType: '' },
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('rejects announcing files in a closed session', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            await sessionsService.closeSession(session.id);

            await expect(
                filesService.announceFile(
                    session.id,
                    sender.id,
                    fileInput,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('upload lifecycle', () => {
        it('transitions a file from announced to uploading to available', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            const uploading = await filesService.startUpload(
                file.id,
                sender.id,
            );

            expect(uploading.uploadStatus).toBe('uploading');

            const available = await filesService.completeUpload(
                file.id,
                sender.id,
            );

            expect(available.uploadStatus).toBe('available');
            expect(available.uploadedAt).toBeDefined();
        });

        it('rejects completing an upload before it starts', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            await expect(
                filesService.completeUpload(file.id, sender.id),
            ).rejects.toThrow();
        });

        it('allows an uploading file to fail', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            await filesService.startUpload(file.id, sender.id);

            const failed = await filesService.failUpload(
                file.id,
                sender.id,
            );

            expect(failed.uploadStatus).toBe('failed');
        });

        it('allows the sender to cancel an announced file', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            const cancelled = await filesService.cancelFile(
                file.id,
                sender.id,
            );

            expect(cancelled.uploadStatus).toBe('cancelled');
        });

        it('rejects invalid transitions from terminal states', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            const file = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            await filesService.cancelFile(file.id, sender.id);

            await expect(
                filesService.startUpload(file.id, sender.id),
            ).rejects.toThrow();
        });

        it('rejects another transfer sender from modifying the file', async () => {
            const first = await createTransferWithParticipants();
            const second = await createTransferWithParticipants();

            const file = await filesService.announceFile(
                first.session.id,
                first.sender.id,
                fileInput,
            );

            await expect(
                filesService.startUpload(file.id, second.sender.id),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('receiver file discovery', () => {
        it('returns only available files to receivers', async () => {
            const { session, sender, receiver } =
                await createTransferWithParticipants();

            const availableFile = await filesService.announceFile(
                session.id,
                sender.id,
                fileInput,
            );

            const uploadingFile = await filesService.announceFile(
                session.id,
                sender.id,
                {
                    name: 'video.mp4',
                    size: 4096,
                    mimeType: 'video/mp4',
                },
            );

            await filesService.startUpload(
                availableFile.id,
                sender.id,
            );

            await filesService.completeUpload(
                availableFile.id,
                sender.id,
            );

            await filesService.startUpload(
                uploadingFile.id,
                sender.id,
            );

            const files = await filesService.getAvailableFilesForReceiver(
                session.id,
                receiver.id,
            );

            expect(files).toHaveLength(1);
            expect(files[0].id).toBe(availableFile.id);
        });

        it('rejects a sender attempting receiver file discovery', async () => {
            const { session, sender } =
                await createTransferWithParticipants();

            await expect(
                filesService.getAvailableFilesForReceiver(
                    session.id,
                    sender.id,
                ),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
