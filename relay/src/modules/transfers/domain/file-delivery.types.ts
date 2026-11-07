export type FileDeliveryStatus =
    | 'pending'
    | 'streaming'
    | 'completed'
    | 'cancelled'
    | 'failed';

export interface FileDelivery {
    id: string;

    fileId: string;
    sessionId: string;

    senderId: string;
    receiverId: string;

    status: FileDeliveryStatus;

    bytesSent: number;

    startedAt?: Date;
    completedAt?: Date;
    updatedAt: Date;
}
