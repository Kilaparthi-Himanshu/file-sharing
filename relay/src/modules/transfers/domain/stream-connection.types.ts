export type StreamDirection = 'upload' | 'download';

export type StreamConnectionStatus =
    | 'opening'
    | 'active'
    | 'completed'
    | 'aborted'
    | 'failed';

export interface StreamConnection {
    id: string;

    sessionId: string;
    fileId: string;
    participantId: string;

    direction: StreamDirection;

    status: StreamConnectionStatus;

    bytesTransferred: number;

    openedAt: Date;
    closedAt?: Date;

    failureReason?: string;
}
