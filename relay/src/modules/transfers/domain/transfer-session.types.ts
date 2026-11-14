export type TransferSessionStatus =
    | 'active'
    | 'draining'
    | 'closed'
    | 'expired';

export interface TransferSession {
    id: string;

    // The participant ID of the one designated sender.
    senderParticipantId: string;

    status: TransferSessionStatus;

    createdAt: Date;
    updatedAt: Date;

    expiredAt?: Date;
    closedAt?: Date;
}
