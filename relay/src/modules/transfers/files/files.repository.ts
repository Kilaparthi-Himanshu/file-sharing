import type { FileTransfer } from '../domain';

export const FILES_REPOSITORY = Symbol('FILES_REPOSITORY');

export interface FilesRepository {
    create(file: FileTransfer): Promise<FileTransfer>;

    findById(id: string): Promise<FileTransfer | null>;

    findBySessionId(sessionId: string): Promise<FileTransfer[]>;

    update(file: FileTransfer): Promise<FileTransfer>;

    delete(id: string): Promise<void>;
}
