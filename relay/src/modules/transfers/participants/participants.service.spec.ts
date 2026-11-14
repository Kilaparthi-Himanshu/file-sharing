
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { SessionsService } from '../sessions/sessions.service';
import { InMemorySessionsRepository } from '../sessions/in-memory-sessions.repository';

import { ParticipantsService } from './participants.service';
import { InMemoryParticipantsRepository } from './in-memory-participants.repository';

describe('ParticipantsService', () => {
    let sessionsService: SessionsService;
    let participantsService: ParticipantsService;

    beforeEach(() => {
        sessionsService = new SessionsService(
            new InMemorySessionsRepository(),
        );

        participantsService = new ParticipantsService(
            new InMemoryParticipantsRepository(),
            sessionsService,
        );
    });

    describe('createSenderParticipant', () => {
        it('creates a sender with the correct role and permissions', async () => {
            const senderId = randomUUID();
            const session = await sessionsService.createSession(senderId);

            const participant =
                await participantsService.createSenderParticipant(
                    session.id,
                    senderId,
                );

            expect(participant.id).toBe(senderId);
            expect(participant.sessionId).toBe(session.id);
            expect(participant.role).toBe('sender');
            expect(participant.status).toBe('active');
            expect(participant.permissions).toEqual({
                canSend: true,
                canReceive: false,
                canManageSession: true,
            });
        });

        it('rejects a participant ID that does not match the designated sender', async () => {
            const senderId = randomUUID();
            const session = await sessionsService.createSession(senderId);

            await expect(
                participantsService.createSenderParticipant(
                    session.id,
                    randomUUID(),
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('rejects creating a second sender for the same session', async () => {
            const senderId = randomUUID();
            const session = await sessionsService.createSession(senderId);

            await participantsService.createSenderParticipant(
                session.id,
                senderId,
            );

            await expect(
                participantsService.createSenderParticipant(
                    session.id,
                    senderId,
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('rejects creating a sender in a closed session', async () => {
            const senderId = randomUUID();
            const session = await sessionsService.createSession(senderId);

            await sessionsService.closeSession(session.id);

            await expect(
                participantsService.createSenderParticipant(
                    session.id,
                    senderId,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('createReceiverParticipant', () => {
        it('creates a receiver with the correct role and permissions', async () => {
            const senderId = randomUUID();
            const session = await sessionsService.createSession(senderId);

            const participant =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            expect(participant.id).toBeDefined();
            expect(participant.sessionId).toBe(session.id);
            expect(participant.role).toBe('receiver');
            expect(participant.status).toBe('active');
            expect(participant.permissions).toEqual({
                canSend: false,
                canReceive: true,
                canManageSession: false,
            });
        });

        it('rejects joining a nonexistent session', async () => {
            await expect(
                participantsService.createReceiverParticipant(
                    '00000000-0000-4000-8000-000000000001',
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('rejects joining a closed session', async () => {
            const session = await sessionsService.createSession(randomUUID());

            await sessionsService.closeSession(session.id);

            await expect(
                participantsService.createReceiverParticipant(session.id),
            ).rejects.toThrow(BadRequestException);
        });

        it('allows multiple receivers in the same session', async () => {
            const session = await sessionsService.createSession(randomUUID());

            const receiver1 =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            const receiver2 =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            expect(receiver1.id).not.toBe(receiver2.id);

            const participants =
                await participantsService.getSessionParticipants(session.id);

            expect(participants).toHaveLength(2);
        });
    });

    describe('participant lifecycle', () => {
        it('retrieves participants belonging to a session', async () => {
            const session = await sessionsService.createSession(randomUUID());

            await participantsService.createReceiverParticipant(session.id);

            const participants =
                await participantsService.getSessionParticipants(session.id);

            expect(participants).toHaveLength(1);
        });

        it('disconnects an active participant', async () => {
            const session = await sessionsService.createSession(randomUUID());

            const participant =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            const disconnected =
                await participantsService.disconnectParticipant(
                    participant.id,
                );

            expect(disconnected.status).toBe('disconnected');
            expect(disconnected.disconnectedAt).toBeDefined();
        });

        it('reconnects a disconnected participant', async () => {
            const session = await sessionsService.createSession(randomUUID());

            const participant =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            await participantsService.disconnectParticipant(participant.id);

            const reconnected =
                await participantsService.reconnectParticipant(
                    participant.id,
                );

            expect(reconnected.status).toBe('active');
            expect(reconnected.disconnectedAt).toBeUndefined();
        });

        it('does not reconnect a participant after session closure', async () => {
            const session = await sessionsService.createSession(randomUUID());

            const participant =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            await participantsService.disconnectParticipant(participant.id);
            await sessionsService.closeSession(session.id);

            await expect(
                participantsService.reconnectParticipant(participant.id),
            ).rejects.toThrow(BadRequestException);
        });

        it('does not allow a participant who left to reconnect', async () => {
            const session = await sessionsService.createSession(randomUUID());

            const participant =
                await participantsService.createReceiverParticipant(
                    session.id,
                );

            await participantsService.leaveParticipant(participant.id);

            await expect(
                participantsService.reconnectParticipant(participant.id),
            ).rejects.toThrow();
        });
    });
});
