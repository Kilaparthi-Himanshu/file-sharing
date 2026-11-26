import { Injectable } from "@nestjs/common";
import type { FileDelivery } from '../domain';
import { DeliveriesRepository } from "./deliveries.repository";

@Injectable()
export class InMemoryDeliveriesRepository implements DeliveriesRepository {
    private readonly deliveries = new Map<string, FileDelivery>();

    private copy(delivery: FileDelivery): FileDelivery {
        return structuredClone(delivery);
    }

    async create(delivery: FileDelivery): Promise<FileDelivery> {
        this.deliveries.set(delivery.id, this.copy(delivery));

        return this.copy(delivery);
    }

    async findById(id: string): Promise<FileDelivery | null> {
        const delivery = this.deliveries.get(id);

        return delivery ? this.copy(delivery) : null;
    }

    async findByFileId(fileId: string): Promise<FileDelivery[]> {
        return Array.from(this.deliveries.values())
            .filter((delivery) => delivery.fileId === fileId)
            .map((delivery) => this.copy(delivery));
    }

    async findByReceiverId(receiverId: string): Promise<FileDelivery[]> {
        return Array.from(this.deliveries.values())
            .filter((delivery) => delivery.receiverId === receiverId)
            .map((delivery) => this.copy(delivery));
    }

    async findByFileAndReceiver(fileId: string, receiverId: string): Promise<FileDelivery | null> {
        const matchingDeliveries = Array.from(this.deliveries.values()).filter(
            (delivery) =>
                delivery.fileId === fileId &&
                delivery.receiverId === receiverId,
        );

        const latestDelivery = matchingDeliveries[matchingDeliveries.length - 1];

        return latestDelivery ? this.copy(latestDelivery) : null;
    }

    async update(delivery: FileDelivery): Promise<FileDelivery> {
        this.deliveries.set(delivery.id, this.copy(delivery));

        return this.copy(delivery);
    }

    async delete(id: string): Promise<void> {
        this.deliveries.delete(id);
    }
}
