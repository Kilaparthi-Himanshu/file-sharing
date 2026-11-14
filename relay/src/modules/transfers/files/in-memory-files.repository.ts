import { Injectable } from '@nestjs/common';

import type { FileTransfer } from '../domain';
import type { FilesRepository } from './files.repository';

@Injectable()
export class InMemoryFilesRepository implements FilesRepository {
    private readonly files = new Map<string, FileTransfer>();

    async create(file: FileTransfer): Promise<FileTransfer> {
        if (this.files.has(file.id)) {
            throw new Error(`File ${file.id} already exists`);
        }

        this.files.set(file.id, structuredClone(file));

        return structuredClone(file);
    }

    async findById(id: string): Promise<FileTransfer | null> {
        const file = this.files.get(id);

        return file ? structuredClone(file) : null;
    }

    async findBySessionId(sessionId: string): Promise<FileTransfer[]> {
        return Array.from(this.files.values())
        .filter((file) => file.sessionId === sessionId)
        .map((file) => structuredClone(file));
    }

    async update(file: FileTransfer): Promise<FileTransfer> {
        if (!this.files.has(file.id)) {
            throw new Error(`File ${file.id} does not exist`);
        }

        this.files.set(file.id, structuredClone(file));

        return structuredClone(file);
    }

    async delete(id: string): Promise<void> {
        this.files.delete(id);
    }
}
