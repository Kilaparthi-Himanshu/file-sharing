import type { StreamConnection } from "../domain";

export const STREAM_CONNECTIONS_REPOSITORY = Symbol(
    'STREAM_CONNECTIONS_REPOSITORY',
);

export interface StreamConnectionsRepository {
    create(connection: StreamConnection): Promise<StreamConnection>;

    findById(id: string): Promise<StreamConnection | null>;

    findByFileId(fileId: string): Promise<StreamConnection[]>;

    findByParticipantId(participantId: string): Promise<StreamConnection[]>;

    update(connection: StreamConnection): Promise<StreamConnection>;

    delete(id: string): Promise<void>;
}
