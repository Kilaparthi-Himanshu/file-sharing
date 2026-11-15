import { Injectable } from '@nestjs/common';

import type { FileTransfer } from '../domain';

import type { FilesRepository } from './files.repository';

@Injectable()
export class InMemoryFilesRepository implements FilesRepository {
    private readonly files = new Map<string, FileTransfer>();

    private copy(file: FileTransfer): FileTransfer {
        return structuredClone(file);
    }

    async create(file: FileTransfer): Promise<FileTransfer> {
        this.files.set(file.id, this.copy(file));

        return this.copy(file);
    }

    async findById(id: string): Promise<FileTransfer | null> {
        const file = this.files.get(id);

        return file ? this.copy(file) : null;
    }

    async findBySessionId(sessionId: string): Promise<FileTransfer[]> {
        return Array.from(this.files.values())
            .filter((file) => file.sessionId === sessionId)
            .map((file) => this.copy(file));
    }

    async update(file: FileTransfer): Promise<FileTransfer> {
        this.files.set(file.id, this.copy(file));

        return this.copy(file);
    }

    async delete(id: string): Promise<void> {
        this.files.delete(id);
    }
}
