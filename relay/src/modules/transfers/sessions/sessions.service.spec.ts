
import { NotFoundException } from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { InMemorySessionsRepository } from './in-memory-sessions.repository';

describe('SessionsService', () => {
    let service: SessionsService;

    beforeEach(() => {
        service = new SessionsService(new InMemorySessionsRepository());
    });

    it('creates an active session', async () => {
        const session = await service.createSession();

        expect(session.id).toBeDefined();
        expect(session.status).toBe('active');
    });

    it('retrieves an existing session', async () => {
        const created = await service.createSession();

        const retrieved = await service.getSession(created.id);

        expect(retrieved.id).toBe(created.id);
    });

    it('throws when a session does not exist', async () => {
        await expect(
            service.getSession('00000000-0000-4000-8000-000000000001'),
        ).rejects.toThrow(NotFoundException);
    });

    it('moves an active session into draining', async () => {
        const session = await service.createSession();

        const draining = await service.drainSession(session.id);

        expect(draining.status).toBe('draining');
    });

    it('closes a draining session', async () => {
        const session = await service.createSession();

        await service.drainSession(session.id);

        const closed = await service.closeSession(session.id);

        expect(closed.status).toBe('closed');
        expect(closed.closedAt).toBeDefined();
    });

    it('does not allow closing a session twice', async () => {
        const session = await service.createSession();

        await service.closeSession(session.id);

        await expect(
            service.closeSession(session.id),
        ).rejects.toThrow();
    });
});
