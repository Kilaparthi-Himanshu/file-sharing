import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import type { TransferSession } from '../domain';

import { SESSION_TRANSITIONS, transitionState } from '../domain';

import { SESSIONS_REPOSITORY } from './sessions.repository';

import type { SessionsRepository } from './sessions.repository';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(SESSIONS_REPOSITORY)
        private readonly repository: SessionsRepository,
    ) {}

    async createSession(): Promise<TransferSession> {
        const now = new Date();

        const session: TransferSession = {
            id: randomUUID(),
            status: 'active',
            createdAt: now,
            updatedAt: now,
        }

        return this.repository.create(session);
    }

    async getSession(id: string): Promise<TransferSession> {
        const session = await this.repository.findById(id);

        if (!session) {
            throw new NotFoundException('Transfer session not found');
        }

        return session;
    }

    async drainSession(id: string): Promise<TransferSession> {
        const session = await this.getSession(id);

        session.status = transitionState(
            'TransferSession',
            session.status,
            'draining',
            SESSION_TRANSITIONS,
        );

        session.updatedAt = new Date();

        return this.repository.update(session);
    }

    async closeSession(id: string): Promise<TransferSession> {
        const session = await this.getSession(id);

        session.status = transitionState(
            'TransferSession',
            session.status,
            'closed',
            SESSION_TRANSITIONS,
        );

        session.updatedAt = new Date();
        session.closedAt = new Date();

        return this.repository.update(session);
    }
}
