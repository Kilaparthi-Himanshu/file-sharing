import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PARTICIPANTS_REPOSITORY } from "./participants.repository";
import type { ParticipantsRepository } from "./participants.repository";
import { SessionsService } from "../sessions/sessions.service";
import { PARTICIPANT_TRANSITIONS, transitionState, type Participant, type ParticipantPermissions } from "../domain";
import { randomUUID } from "node:crypto";

@Injectable()
export class ParticipantsService {
    constructor(
        @Inject(PARTICIPANTS_REPOSITORY)
        private readonly repository: ParticipantsRepository,

        private readonly sessionsService: SessionsService,
    ) {}

    async createSenderParticipant(sessionId: string, participantId: string): Promise<Participant> {
        const session = await this.sessionsService.getSession(sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot create a sender for a session that is not active');
        }

        if (session.senderParticipantId !== participantId) {
            throw new BadRequestException('Participant ID does not match the designated sender');
        }

        const existingSender = await this.repository.findSenderBySessionId(sessionId);

        if (existingSender) {
            throw new ConflictException('A sender already exists for this session');
        }

        const now = new Date();

        const participant: Participant = {
            id: participantId,
            sessionId,
            role: 'sender',
            status: 'active',
            permissions: {
                canSend: true,
                canReceive: false,
                canManageSession: true,
            },
            joinedAt: now,
            lastSeenAt: now,
        }

        return this.repository.create(participant);
    }

    async createReceiverParticipant(sessionId: string): Promise<Participant> {
        const session = await this.sessionsService.getSession(sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot join a session that is not active');
        }

        const now = new Date();

        const participant: Participant = {
            id: randomUUID(),
            sessionId,
            role: 'receiver',
            status: 'active',
            permissions: {
                canSend: false,
                canReceive: true,
                canManageSession: false,
            },
            joinedAt: now,
            lastSeenAt: now,
        }

        return this.repository.create(participant);
    }

    async getParticipant(id: string): Promise<Participant> {
        const participant = await this.repository.findById(id);

        if (!participant) {
            throw new NotFoundException('Participant not found');
        }

        return participant;
    }

    async getSessionParticipants(sessionId: string): Promise<Participant[]> {
        await this.sessionsService.getSession(sessionId);

        return this.repository.findBySessionId(sessionId);
    }

    async disconnectParticipant(id: string): Promise<Participant> {
        const participant = await this.getParticipant(id);

        participant.status = transitionState(
            'Participant',
            participant.status,
            'disconnected',
            PARTICIPANT_TRANSITIONS,
        );

        const now = new Date();

        participant.lastSeenAt = now;
        participant.disconnectedAt = now;

        return this.repository.update(participant);
    }

    async reconnectParticipant(id: string): Promise<Participant> {
        const participant = await this.getParticipant(id);

        const session = await this.sessionsService.getSession(participant.sessionId);

        if (session.status !== 'active') {
            throw new BadRequestException('Cannot reconnect to a session that is not active');
        }

        participant.status = transitionState(
            'Participant',
            participant.status,
            'active',
            PARTICIPANT_TRANSITIONS,
        );

        participant.lastSeenAt = new Date();
        participant.disconnectedAt = undefined;

        return this.repository.update(participant);
    }

    async leaveParticipant(id: string): Promise<Participant> {
        const participant = await this.getParticipant(id);

        participant.status = transitionState(
            'Participant',
            participant.status,
            'left',
            PARTICIPANT_TRANSITIONS,
        );

        participant.lastSeenAt = new Date();

        return this.repository.update(participant);
    }

    async updateLastSeen(id: string): Promise<Participant> {
        const participant = await this.getParticipant(id);

        if (participant.status !== 'active') {
            throw new BadRequestException('Only active participants can update their activity');
        }

        participant.lastSeenAt = new Date();

        return this.repository.update(participant);
    }
}
