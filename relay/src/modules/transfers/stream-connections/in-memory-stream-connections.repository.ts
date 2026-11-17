import { Injectable } from '@nestjs/common';

import type { StreamConnection } from '../domain';
import type { StreamConnectionsRepository } from './stream-connections.repository';

@Injectable()
export class InMemoryStreamConnectionsRepository implements StreamConnectionsRepository {
    private readonly connections = new Map<string, StreamConnection>();

    private copy(connection: StreamConnection): StreamConnection {
        return structuredClone(connection);
    }

    async create(connection: StreamConnection): Promise<StreamConnection> {
        this.connections.set(connection.id, this.copy(connection));

        return this.copy(connection);
    }

    async findById(id: string): Promise<StreamConnection | null> {
        const connection = this.connections.get(id);

        return connection ? this.copy(connection) : null;
    }

    async findByFileId(fileId: string): Promise<StreamConnection[]> {
        return Array.from(this.connections.values())
            .filter((connection) => connection.fileId === fileId)
            .map((connection) => this.copy(connection));
    }

    async findByParticipantId(participantId: string): Promise<StreamConnection[]> {
        return Array.from(this.connections.values())
            .filter((connection) => connection.participantId === participantId)
            .map((connection) => this.copy(connection));
    }

    async update(connection: StreamConnection): Promise<StreamConnection> {
        this.connections.set(connection.id, this.copy(connection));

        return this.copy(connection);
    }

    async delete(id: string): Promise<void> {
        this.connections.delete(id);
    }
}