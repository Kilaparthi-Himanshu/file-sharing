import { Test, TestingModule } from '@nestjs/testing';

import { DeliveriesService } from './deliveries.service';

import { SessionsService } from '../sessions/sessions.service';
import { ParticipantsService } from '../participants/participants.service';
import { FilesService } from '../files/files.service';

import { TransfersModule } from '../transfers.module';
import { TransfersService } from '../transfers.service';
import { ForbiddenException } from '@nestjs/common';

describe('DeliveriesService', () => {
    let service: DeliveriesService;
    let transfersService: TransfersService;
    let participantsService: ParticipantsService;
    let filesService: FilesService;

    let sessionId: string;
    let senderId: string;
    let receiverOneId: string;
    let receiverTwoId: string;
    let fileId: string;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [TransfersModule],
        }).compile();

        service = module.get(DeliveriesService);
        transfersService = module.get(TransfersService);
        participantsService = module.get(ParticipantsService);
        filesService = module.get(FilesService);

        // Create a transfer session and its sender.
        const transfer = await transfersService.createTransfer();

        sessionId = transfer.transferId;
        senderId = transfer.senderParticipant.id;

        // Join two receivers.
        const receiverOne =
        await participantsService.createReceiverParticipant(sessionId);
        const receiverTwo =
        await participantsService.createReceiverParticipant(sessionId);

        receiverOneId = receiverOne.id;
        receiverTwoId = receiverTwo.id;

        // Announce a file.
        const file = await filesService.announceFile(sessionId, senderId, {
            name: 'test.txt',
            size: 1024,
            mimeType: 'text/plain',
        });

        fileId = file.id;

        // Mark the upload as available.
        await filesService.startUpload(fileId, senderId);
        await filesService.completeUpload(fileId, senderId);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a pending delivery for an available file', async () => {
        const delivery = await service.createDelivery(fileId, receiverOneId);

        expect(delivery).toMatchObject({
            fileId,
            sessionId,
            senderId,
            receiverId: receiverOneId,
            status: 'pending',
            bytesSent: 0,
        });

        expect(delivery.id).toBeDefined();
    });

    it('should create independent deliveries for multiple receivers', async () => {
        const deliveryOne = await service.createDelivery(fileId, receiverOneId);
        const deliveryTwo = await service.createDelivery(fileId, receiverTwoId);

        expect(deliveryOne.id).not.toBe(deliveryTwo.id);

        expect(deliveryOne.receiverId).toBe(receiverOneId);
        expect(deliveryTwo.receiverId).toBe(receiverTwoId);

        expect(deliveryOne.fileId).toBe(fileId);
        expect(deliveryTwo.fileId).toBe(fileId);

        expect(deliveryOne.status).toBe('pending');
        expect(deliveryTwo.status).toBe('pending');
    });

    it('should return the existing delivery when the same receiver requests it again', async () => {
        const firstDelivery = await service.createDelivery(fileId, receiverOneId);
        const secondDelivery = await service.createDelivery(fileId, receiverOneId);

        expect(secondDelivery.id).toBe(firstDelivery.id);
        expect(secondDelivery.receiverId).toBe(receiverOneId);
        expect(secondDelivery.status).toBe('pending');
    });

    it('should return the existing delivery when it is already streaming', async () => {
        const firstDelivery = await service.createDelivery(fileId, receiverOneId);

        const startedDelivery = await service.startDelivery(
            firstDelivery.id,
            receiverOneId,
        );

        expect(startedDelivery.status).toBe('streaming');

        const secondDelivery = await service.createDelivery(fileId, receiverOneId);

        expect(secondDelivery.id).toBe(firstDelivery.id);
        expect(secondDelivery.status).toBe('streaming');
    });

    it('should reject delivery creation by the sender', async () => {
        await expect(
            service.createDelivery(fileId, senderId),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should reject delivery creation by a receiver from another session', async () => {
        const anotherTransfer = await transfersService.createTransfer();

        const anotherReceiver =
            await participantsService.createReceiverParticipant(
                anotherTransfer.transferId,
            );

        await expect(
            service.createDelivery(fileId, anotherReceiver.id),
        ).rejects.toThrow();
    });

    it('should not expose another receiver delivery', async () => {
        const delivery = await service.createDelivery(fileId, receiverOneId);

        const receiverTwoDeliveries =
            await service.getReceiverDeliveries(receiverTwoId);

        expect(
            receiverTwoDeliveries.some((item) => item.id === delivery.id),
        ).toBe(false);
    });

    it('should reject delivery creation for a file that is not available', async () => {
        const anotherFile = await filesService.announceFile(
            sessionId,
            senderId,
            {
            name: 'pending.txt',
            size: 512,
            mimeType: 'text/plain',
            },
        );

        await expect(
            service.createDelivery(anotherFile.id, receiverOneId),
        ).rejects.toThrow();
    });

    it('should start a delivery and update its progress', async () => {
  const delivery = await service.createDelivery(fileId, receiverOneId);

  const started = await service.startDelivery(
    delivery.id,
    receiverOneId,
  );

  expect(started.status).toBe('streaming');

  const updated = await service.updateProgress(
    delivery.id,
    receiverOneId,
    512,
  );

  expect(updated.bytesSent).toBe(512);
  expect(updated.status).toBe('streaming');
});

it('should reject progress updates that decrease bytes sent', async () => {
  const delivery = await service.createDelivery(fileId, receiverOneId);

  await service.startDelivery(delivery.id, receiverOneId);

  await service.updateProgress(delivery.id, receiverOneId, 512);

  await expect(
    service.updateProgress(delivery.id, receiverOneId, 256),
  ).rejects.toThrow();
});

    it('should reject progress updates exceeding file size', async () => {
        const delivery = await service.createDelivery(fileId, receiverOneId);

        await service.startDelivery(delivery.id, receiverOneId);

        await expect(
            service.updateProgress(delivery.id, receiverOneId, 1025),
        ).rejects.toThrow();
    });

    it('should reject completion before all bytes are transferred', async () => {
        const delivery = await service.createDelivery(fileId, receiverOneId);

        await service.startDelivery(delivery.id, receiverOneId);

        await service.updateProgress(delivery.id, receiverOneId, 512);

        await expect(
            service.completeDelivery(delivery.id, receiverOneId),
        ).rejects.toThrow();
    });

    it('should complete a delivery after all bytes are transferred', async () => {
        const delivery = await service.createDelivery(fileId, receiverOneId);

        await service.startDelivery(delivery.id, receiverOneId);

        await service.updateProgress(delivery.id, receiverOneId, 1024);

        const completed = await service.completeDelivery(
            delivery.id,
            receiverOneId,
        );

        expect(completed.status).toBe('completed');
        expect(completed.bytesSent).toBe(1024);
        expect(completed.completedAt).toBeDefined();
    });

    it('should cancel one receiver delivery without affecting another', async () => {
        const deliveryOne = await service.createDelivery(fileId, receiverOneId);
        const deliveryTwo = await service.createDelivery(fileId, receiverTwoId);

        await service.cancelDelivery(deliveryOne.id, receiverOneId);

        const receiverOneDeliveries =
            await service.getReceiverDeliveries(receiverOneId);

        const receiverTwoDeliveries =
            await service.getReceiverDeliveries(receiverTwoId);

        expect(receiverOneDeliveries[0].status).toBe('cancelled');
        expect(receiverTwoDeliveries[0].status).toBe('pending');

        expect(receiverTwoDeliveries[0].id).toBe(deliveryTwo.id);
    });

    it('should fail one receiver delivery without affecting another', async () => {
        const deliveryOne = await service.createDelivery(fileId, receiverOneId);
        const deliveryTwo = await service.createDelivery(fileId, receiverTwoId);

        await service.startDelivery(deliveryOne.id, receiverOneId);
        await service.failDelivery(deliveryOne.id, receiverOneId);

        const receiverOneDeliveries =
            await service.getReceiverDeliveries(receiverOneId);

        const receiverTwoDeliveries =
            await service.getReceiverDeliveries(receiverTwoId);

        expect(receiverOneDeliveries[0].status).toBe('failed');
        expect(receiverTwoDeliveries[0].status).toBe('pending');

        expect(receiverTwoDeliveries[0].id).toBe(deliveryTwo.id);
    });

    it('should allow the sender to list deliveries for their file', async () => {
        await service.createDelivery(fileId, receiverOneId);
        await service.createDelivery(fileId, receiverTwoId);

        const deliveries = await service.getFileDeliveries(fileId, senderId);

        expect(deliveries).toHaveLength(2);
        expect(deliveries.map((delivery) => delivery.receiverId)).toEqual(
            expect.arrayContaining([receiverOneId, receiverTwoId]),
        );
    });

    it('should reject another sender from listing file deliveries', async () => {
        const anotherTransfer = await transfersService.createTransfer();

        await expect(
            service.getFileDeliveries(fileId, anotherTransfer.senderParticipant.id),
        ).rejects.toThrow();
    });

    it('should create a new delivery attempt after a previous attempt failed', async () => {
        const firstDelivery = await service.createDelivery(
            fileId,
            receiverOneId,
        );

        await service.startDelivery(firstDelivery.id, receiverOneId);
        await service.updateProgress(firstDelivery.id, receiverOneId, 256);
        await service.failDelivery(firstDelivery.id, receiverOneId);

        const retryDelivery = await service.createDelivery(
            fileId,
            receiverOneId,
        );

        expect(retryDelivery.id).not.toBe(firstDelivery.id);
        expect(retryDelivery.status).toBe('pending');
        expect(retryDelivery.bytesSent).toBe(0);

        const attempts = await service.getReceiverDeliveries(receiverOneId);

        expect(attempts).toHaveLength(2);
        expect(attempts.map((delivery) => delivery.status)).toEqual([
            'failed',
            'pending',
        ]);
    });
});
