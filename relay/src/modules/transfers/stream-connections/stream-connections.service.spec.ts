import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';

import { TransfersModule } from '../transfers.module';

import { TransfersService } from '../transfers.service';
import { ParticipantsService } from '../participants/participants.service';
import { FilesService } from '../files/files.service';
import { DeliveriesService } from '../deliveries/deliveries.service';

import { StreamConnectionsService } from './stream-connections.service';

import { STREAM_CONNECTIONS_REPOSITORY } from './stream-connections.repository';

describe('StreamConnectionsService', () => {
    let service: StreamConnectionsService;
    let transfersService: TransfersService;
    let participantsService: ParticipantsService;
    let filesService: FilesService;
    let deliveriesService: DeliveriesService;

    let sessionId: string;
    let senderId: string;
    let receiverId: string;
    let fileId: string;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [TransfersModule],
        }).compile();

        service = module.get(StreamConnectionsService);
        transfersService = module.get(TransfersService);
        participantsService = module.get(ParticipantsService);
        filesService = module.get(FilesService);
        deliveriesService = module.get(DeliveriesService);

        const transfer = await transfersService.createTransfer();

        sessionId = transfer.transferId;
        senderId = transfer.senderParticipant.id;

        const receiver =
            await participantsService.createReceiverParticipant(sessionId);

        receiverId = receiver.id;

        const file = await filesService.announceFile(sessionId, senderId, {
            name: 'test.txt',
            size: 1024,
            mimeType: 'text/plain',
        });

        fileId = file.id;
    });

    async function makeFileAvailable(): Promise<void> {
        await filesService.startUpload(fileId, senderId);
        await filesService.completeUpload(fileId, senderId);
    }

    async function createDownloadDelivery(): Promise<string> {
        await makeFileAvailable();

        const delivery = await deliveriesService.createDelivery(
            fileId,
            receiverId,
        );

        return delivery.id;
    }

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUploadConnection', () => {
        it('should create an opening upload connection for the sender', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            expect(connection).toMatchObject({
                sessionId,
                fileId,
                participantId: senderId,
                direction: 'upload',
                status: 'opening',
                bytesTransferred: 0,
            });

            expect(connection.id).toBeDefined();
        });

        it('should reject a receiver attempting to upload', async () => {
            await expect(
                service.createUploadConnection(
                    sessionId,
                    fileId,
                    receiverId,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should reject another session sender attempting to upload the file', async () => {
            const anotherTransfer = await transfersService.createTransfer();

            await expect(
                service.createUploadConnection(
                    sessionId,
                    fileId,
                    anotherTransfer.senderParticipant.id,
                ),
            ).rejects.toThrow();
        });

        it('should reject a second active upload connection for the same file', async () => {
            await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await expect(
                service.createUploadConnection(
                    sessionId,
                    fileId,
                    senderId,
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('should reject an upload connection for an unavailable file state', async () => {
            await makeFileAvailable();

            await expect(
                service.createUploadConnection(
                    sessionId,
                    fileId,
                    senderId,
                ),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('createDownloadConnection', () => {
        it('should create an opening download connection for the receiver', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            expect(connection).toMatchObject({
                sessionId,
                fileId,
                participantId: receiverId,
                deliveryId,
                direction: 'download',
                status: 'opening',
                bytesTransferred: 0,
            });

            expect(connection.id).toBeDefined();
        });

        it('should reject a different receiver using the delivery', async () => {
            const deliveryId = await createDownloadDelivery();

            const anotherReceiver =
                await participantsService.createReceiverParticipant(sessionId);

            await expect(
                service.createDownloadConnection(
                    deliveryId,
                    anotherReceiver.id,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should reject the sender attempting to download as a receiver', async () => {
            const deliveryId = await createDownloadDelivery();

            await expect(
                service.createDownloadConnection(
                    deliveryId,
                    senderId,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should reject a second active download connection for the same delivery', async () => {
            const deliveryId = await createDownloadDelivery();

            await service.createDownloadConnection(deliveryId, receiverId);

            await expect(
                service.createDownloadConnection(deliveryId, receiverId),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('connection lifecycle', () => {
        it('should activate an upload connection and start the file upload', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            const activated = await service.activateConnection(connection.id);
            const file = await filesService.getFile(fileId);

            expect(activated.status).toBe('active');
            expect(file.uploadStatus).toBe('uploading');
        });

        it('should activate a download connection and start the delivery', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            const activated = await service.activateConnection(connection.id);
            const delivery = await deliveriesService.getDelivery(deliveryId);

            expect(activated.status).toBe('active');
            expect(delivery.status).toBe('streaming');
        });

        it('should reject activating a connection more than once', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);

            await expect(
                service.activateConnection(connection.id),
            ).rejects.toThrow(ConflictException);
        });

        it('should update connection progress', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);

            const updated = await service.updateProgress(
                connection.id,
                512,
            );

            expect(updated.bytesTransferred).toBe(512);
        });

        it('should reject decreasing progress', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);
            await service.updateProgress(connection.id, 512);

            await expect(
                service.updateProgress(connection.id, 256),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject progress exceeding the file size', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);

            await expect(
                service.updateProgress(connection.id, 1025),
            ).rejects.toThrow(BadRequestException);
        });

        it('should complete an upload and make the file available', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);
            await service.updateProgress(connection.id, 1024);

            const completed = await service.completeConnection(connection.id);
            const file = await filesService.getFile(fileId);

            expect(completed.status).toBe('completed');
            expect(completed.bytesTransferred).toBe(1024);
            expect(completed.closedAt).toBeDefined();
            expect(file.uploadStatus).toBe('available');
        });

        it('should reject completing a connection before all bytes are transferred', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);
            await service.updateProgress(connection.id, 512);

            await expect(
                service.completeConnection(connection.id),
            ).rejects.toThrow(BadRequestException);
        });

        it('should abort an opening connection', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            const aborted = await service.abortConnection(connection.id);

            expect(aborted.status).toBe('aborted');
            expect(aborted.closedAt).toBeDefined();
        });

        it('should mark the file upload as failed when an upload connection is aborted', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.abortConnection(connection.id);

            const file = await filesService.getFile(fileId);

            expect(file.uploadStatus).toBe('failed');
        });

        it('should fail an active connection and record the reason', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);

            const failed = await service.failConnection(
                connection.id,
                'Network connection lost',
            );

            expect(failed.status).toBe('failed');
            expect(failed.failureReason).toBe('Network connection lost');
            expect(failed.closedAt).toBeDefined();
        });

        it('should mark the file upload as failed when an upload connection fails', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await service.activateConnection(connection.id);

            await service.failConnection(
                connection.id,
                'Network connection lost',
            );

            const file = await filesService.getFile(fileId);

            expect(file.uploadStatus).toBe('failed');
        });

        it('should reject an empty failure reason', async () => {
            const connection = await service.createUploadConnection(
                sessionId,
                fileId,
                senderId,
            );

            await expect(
                service.failConnection(connection.id, '   '),
            ).rejects.toThrow(BadRequestException);
        });

        it('should update download progress in both connection and delivery', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            await service.activateConnection(connection.id);

            const updated = await service.updateProgress(connection.id, 512);
            const delivery = await deliveriesService.getDelivery(deliveryId);

            expect(updated.bytesTransferred).toBe(512);
            expect(delivery.bytesSent).toBe(512);
            expect(delivery.status).toBe('streaming');
        });

        it('should reject download progress exceeding the file size', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            await service.activateConnection(connection.id);

            await expect(
                service.updateProgress(connection.id, 1025),
            ).rejects.toThrow(BadRequestException);
        });

        it('should complete a download and mark its delivery as completed', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            await service.activateConnection(connection.id);
            await service.updateProgress(connection.id, 1024);

            const completed = await service.completeConnection(connection.id);
            const delivery = await deliveriesService.getDelivery(deliveryId);

            expect(completed.status).toBe('completed');
            expect(completed.bytesTransferred).toBe(1024);
            expect(delivery.status).toBe('completed');
            expect(delivery.bytesSent).toBe(1024);
            expect(delivery.completedAt).toBeDefined();
        });

        it('should allow a receiver to retry a failed download with a new delivery and connection', async () => {
            const originalDeliveryId = await createDownloadDelivery();

            const originalConnection =
                await service.createDownloadConnection(
                originalDeliveryId,
                receiverId,
                );

            await service.activateConnection(originalConnection.id);

            await service.failConnection(
                originalConnection.id,
                'Network connection lost',
            );

            const retryDelivery = await deliveriesService.createDelivery(
                fileId,
                receiverId,
            );

            expect(retryDelivery.id).not.toBe(originalDeliveryId);
            expect(retryDelivery.status).toBe('pending');
            expect(retryDelivery.bytesSent).toBe(0);

            const retryConnection =
                await service.createDownloadConnection(
                retryDelivery.id,
                receiverId,
                );

            expect(retryConnection.id).not.toBe(originalConnection.id);
            expect(retryConnection.deliveryId).toBe(retryDelivery.id);
            expect(retryConnection.status).toBe('opening');
        });

        it('should reject activating a download connection without a delivery ID', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            // Simulate an invalid persisted download connection.
            // The repository stores a clone, so update the stored record as well.
            const repository = module.get(STREAM_CONNECTIONS_REPOSITORY);
            await repository.update({
                ...connection,
                deliveryId: undefined,
            });

            await expect(
                service.activateConnection(connection.id),
            ).rejects.toThrow(BadRequestException);
        });

        it('should mark a delivery as failed when its download connection is aborted', async () => {
            const deliveryId = await createDownloadDelivery();

            const connection = await service.createDownloadConnection(
                deliveryId,
                receiverId,
            );

            await service.activateConnection(connection.id);
            await service.abortConnection(connection.id);

            const delivery = await deliveriesService.getDelivery(deliveryId);

            expect(delivery.status).toBe('failed');
        });

        it('should not affect another receiver when a download connection fails', async () => {
            await makeFileAvailable();

            const receiverTwo =
                await participantsService.createReceiverParticipant(sessionId);

            const deliveryOne = await deliveriesService.createDelivery(
                fileId,
                receiverId,
            );

            const deliveryTwo = await deliveriesService.createDelivery(
                fileId,
                receiverTwo.id,
            );

            const connection = await service.createDownloadConnection(
                deliveryOne.id,
                receiverId,
            );

            await service.activateConnection(connection.id);

            await service.failConnection(
                connection.id,
                'Network connection lost',
            );

            const failedDelivery = await deliveriesService.getDelivery(
                deliveryOne.id,
            );

            const unaffectedDelivery = await deliveriesService.getDelivery(
                deliveryTwo.id,
            );

            expect(failedDelivery.status).toBe('failed');
            expect(unaffectedDelivery.status).toBe('pending');
        });
    });
});
