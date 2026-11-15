import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { SessionsService } from './sessions/sessions.service';
import { InMemorySessionsRepository } from './sessions/in-memory-sessions.repository';

import { ParticipantsService } from './participants/participants.service';
import { InMemoryParticipantsRepository } from './participants/in-memory-participants.repository';

import { TransfersService } from './transfers.service';

describe('TransfersService', () => {
    let sessionsService: SessionsService;
    let participantsService: ParticipantsService;
    let transfersService: TransfersService;

    beforeEach(() => {
        sessionsService = new SessionsService(
            new InMemorySessionsRepository(),
        );

        participantsService = new ParticipantsService(
            new InMemoryParticipantsRepository(),
            sessionsService,
        );

        transfersService = new TransfersService(
            sessionsService,
            participantsService,
        );
    });

    describe('createTransfer', () => {
        it('creates a transfer with a designated sender', async () => {
            const result = await transfersService.createTransfer();

            expect(result.transferId).toBe(result.session.id);

            expect(result.session.status).toBe('active');

            expect(result.senderParticipant.id).toBe(
                result.session.senderParticipantId,
            );

            expect(result.senderParticipant.sessionId).toBe(
                result.session.id,
            );

            expect(result.senderParticipant.role).toBe('sender');

            expect(result.senderParticipant.permissions).toEqual({
                canSend: true,
                canReceive: false,
                canManageSession: true,
            });
        });

        it('creates independent transfers with different sessions and senders', async () => {
            const firstTransfer = await transfersService.createTransfer();
            const secondTransfer = await transfersService.createTransfer();

            expect(firstTransfer.transferId).not.toBe(
                secondTransfer.transferId,
            );

            expect(firstTransfer.senderParticipant.id).not.toBe(
                secondTransfer.senderParticipant.id,
            );

            expect(firstTransfer.session.senderParticipantId).toBe(
                firstTransfer.senderParticipant.id,
            );

            expect(secondTransfer.session.senderParticipantId).toBe(
                secondTransfer.senderParticipant.id,
            );
        });

        it('removes the session if sender creation fails', async () => {
            let createdSessionId: string | undefined;

            const originalCreateSession = sessionsService.createSession.bind(
                sessionsService,
            );

            jest.spyOn(
                sessionsService,
                'createSession',
            ).mockImplementation(async (senderId) => {
                const session = await originalCreateSession(senderId);
                createdSessionId = session.id;
                return session;
            });

            jest.spyOn(
                participantsService,
                'createSenderParticipant',
            ).mockRejectedValueOnce(new Error('Sender creation failed'));

            await expect(
                transfersService.createTransfer(),
            ).rejects.toThrow('Sender creation failed');

            expect(createdSessionId).toBeDefined();

            await expect(
                sessionsService.getSession(createdSessionId!),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
