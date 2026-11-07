export type ParticipantStatus =
    | 'active'
    | 'disconnected'
    | 'left';

export interface ParticipantPermissions {
    canSend: boolean;
    canReceive: boolean;
    canManageSession: boolean;
}

export interface Participant {
    id: string;
    sessionId: string;

    status: ParticipantStatus;

    permission: ParticipantPermissions;

    joinedAt: Date;
    lastSeenAt: Date;
    disconnectedAt?: Date;
}
