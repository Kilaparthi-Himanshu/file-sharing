export type ParticipantRole = 'sender' | 'receiver';

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

    role: ParticipantRole;
    status: ParticipantStatus;

    permissions: ParticipantPermissions;

    joinedAt: Date;
    lastSeenAt: Date;
    disconnectedAt?: Date;
}
