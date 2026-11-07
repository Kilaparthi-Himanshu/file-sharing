export type TransferSessionStatus = 
    | 'active'
    | 'draining'
    | 'closed'
    | 'expired';

export interface TransferSession {
    id: string;

    status: TransferSessionStatus;

    createdAt: Date;
    updatedAt: Date;

    expiredAt?: Date;
    closedAt?: Date;
}
