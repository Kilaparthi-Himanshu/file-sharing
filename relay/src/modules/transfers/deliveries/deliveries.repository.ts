import type { FileDelivery } from '../domain';

export const DELIVERIES_REPOSITORY = Symbol('DELIVERIES_REPOSITORY');

export interface DeliveriesRepository {
    create(delivery: FileDelivery): Promise<FileDelivery>;

    findById(id: string): Promise<FileDelivery | null>;

    findByFileId(fileId: string): Promise<FileDelivery[]>;

    findByReceiverId(receiverId: string): Promise<FileDelivery[]>;

    findByFileAndReceiver(fileId: string, receiverId: string): Promise<FileDelivery | null>;

    update(delivery: FileDelivery): Promise<FileDelivery>;

    delete(id: string): Promise<void>;
}
