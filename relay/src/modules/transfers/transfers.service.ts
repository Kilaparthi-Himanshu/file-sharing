import { Injectable } from "@nestjs/common";
import { Participant, TransferSession } from "./domain";
import { SessionsService } from "./sessions/sessions.service";
import { ParticipantsService } from "./participants/participants.service";
import { randomUUID } from "node:crypto";

export interface CreateTransferResult {
    transferId: string;
    session: TransferSession;
    senderParticipant: Participant;
}

@Injectable()
export class TransfersService {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly participantService: ParticipantsService,
    ) {}

    async createTransfer(): Promise<CreateTransferResult> {
        const senderParticipantId = randomUUID();

        // 1. Create the session with its designated sender ID.
        const session = await this.sessionsService.createSession(senderParticipantId);

        try {
            // 2. Create the designated sender participant.
            const senderParticipant = await this.participantService.createSenderParticipant(
                session.id,
                senderParticipantId,
            );

            // 3. Return the transfer details.
            return {
                transferId: session.id,
                session,
                senderParticipant,
            }
        } catch (error) {
            // Roll back the session if sender creation fails.
            await this.sessionsService.deleteSession(session.id);

            throw error;
        }
    }
}
