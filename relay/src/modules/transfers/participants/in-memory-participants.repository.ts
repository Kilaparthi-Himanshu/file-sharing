import { Injectable } from "@nestjs/common";

import type { Participant } from "../domain";
import type { ParticipantsRepository } from "./participants.repository";

export class InMemoryParticipantsRepository implements ParticipantsRepository {
    private readonly participants = new Map<string, Participant>();

    private copy(participant: Participant): Participant {
        return structuredClone(participant);
    }

    async create(participant: Participant): Promise<Participant> {
        if (this.participants.has(participant.id)) {
            throw new Error(`Participant ${participant.id} already exists`);
        }

        this.participants.set(participant.id, this.copy(participant));

        return this.copy(participant);
    }

    async findById(id: string): Promise<Participant | null> {
        const participant = this.participants.get(id);

        return participant ? this.copy(participant) : null;
    }

    async findBySessionId(sessionId: string): Promise<Participant[]> {
        return Array.from(this.participants.values())
            .filter((participant) => participant.sessionId === sessionId)
            .map((participant) => this.copy(participant));
    }

    async findSenderBySessionId(sessionId: string): Promise<Participant | null> {
        const sender = Array.from(this.participants.values()).find(
            (participant) =>
                participant.sessionId === sessionId &&
                participant.role === 'sender'
        );

        return sender ? this.copy(sender) : null;
    }

    async update(participant: Participant): Promise<Participant> {
        if (!this.participants.has(participant.id)) {
            throw new Error(`Participant ${participant.id} does not exist`);
        }

        this.participants.set(participant.id, this.copy(participant));

        return this.copy(participant);
    }

    async delete(id: string): Promise<void> {
        this.participants.delete(id);
    }
}
