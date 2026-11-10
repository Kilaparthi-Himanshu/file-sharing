import { Injectable } from "@nestjs/common";

import type { TransferSession } from "../domain";
import type { SessionsRepository } from "./sessions.repository";

@Injectable()
export class InMemorySessionsRepository implements SessionsRepository {
    private readonly sessions = new Map<string, TransferSession>();

    async create(session: TransferSession): Promise<TransferSession> {
        if (this.sessions.has(session.id)) {
            throw new Error(`Session ${session.id} already exists`);
        }

        this.sessions.set(session.id, structuredClone(session));

        return structuredClone(session);
    }

    async findById(id: string): Promise<TransferSession | null> {
        const session = this.sessions.get(id);

        return session ? structuredClone(session) : null;
    }

    async update(session: TransferSession): Promise<TransferSession> {
        if (!this.sessions.has(session.id)) {
            throw new Error(`Session ${session.id} does not exist`);
        }

        this.sessions.set(session.id, structuredClone(session));

        return structuredClone(session);
    }

    async delete(id: string): Promise<void> {
        this.sessions.delete(id);
    }
}
