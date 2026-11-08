import type { TransferSessionStatus } from './transfer-session.types';
import type { ParticipantStatus } from './participant.types';
import type { FileUploadStatus } from './file-transfer.types';
import type { FileDeliveryStatus } from './file-delivery.types';
import type { StreamConnectionStatus } from './stream-connection.types';

import { InvalidStateTransitionError } from './errors/invalid-state-transition.error';

type TransitionMap<S extends string> = {
    readonly [State in S]: readonly S[];
}

export const SESSION_TRANSITIONS: TransitionMap<TransferSessionStatus> = {
    active: ['draining', 'closed', 'expired'],
    draining: ['closed'],
    closed: [],
    expired: [],
}

export const PARTICIPANT_TRANSITIONS: TransitionMap<ParticipantStatus> = {
    active: ['disconnected', 'left'],
    disconnected: ['active', 'left'],
    left: [],
}

export const FILE_UPLOAD_TRANSITIONS: TransitionMap<FileUploadStatus> = {
    announced: ['uploading', 'cancelled', 'failed'],
    uploading: ['available', 'cancelled', 'failed'],
    available: ['cancelled'],
    failed: [],
    cancelled: [],
}

export const FILE_DELIVERY_TRANSITIONS: TransitionMap<FileDeliveryStatus> = {
    pending: ['streaming', 'cancelled', 'failed'],
    streaming: ['completed', 'cancelled', 'failed'],
    completed: [],
    cancelled: [],
    failed: [],
}

export const STREAM_CONNECTION_TRANSITIONS: TransitionMap<StreamConnectionStatus> = {
  opening: ['active', 'aborted', 'failed'],
  active: ['completed', 'aborted', 'failed'],
  completed: [],
  aborted: [],
  failed: [],
}

export function transitionState<S extends string>(
    entity: string,
    currentState: S,
    nextState: S,
    transitions: TransitionMap<S>,
) {
    if (!transitions[currentState].includes(nextState)) {
        throw new InvalidStateTransitionError(
            entity,
            currentState,
            nextState,
        );
    }

    return nextState;
}

export function canTransition<S extends string>(
    currentState: S,
    nextState: S,
    transitions: TransitionMap<S>,
): boolean {
    return transitions[currentState].includes(nextState);
}
