import {
  SESSION_TRANSITIONS,
  FILE_UPLOAD_TRANSITIONS,
  FILE_DELIVERY_TRANSITIONS,
  STREAM_CONNECTION_TRANSITIONS,
  PARTICIPANT_TRANSITIONS,
  transitionState,
  canTransition,
} from './state-transitions';

import { InvalidStateTransitionError } from './errors/invalid-state-transition.error';

describe('Transfer state machines', () => {
    describe('Transfer session', () => {
        it('allows active -> draining', () => {
            expect(
                transitionState('TransferSession', 'active', 'draining', SESSION_TRANSITIONS),
            ).toBe('draining');
        });

        it('does not allow closed -> active', () => {
            expect(() =>
                transitionState('TransferSession', 'closed', 'active', SESSION_TRANSITIONS),
            ).toThrow(InvalidStateTransitionError);
        });
    });

    describe('Participant', () => {
        it('allows disconnected -> active', () => {
            expect(
                transitionState('Participant', 'disconnected', 'active', PARTICIPANT_TRANSITIONS),
            ).toBe('active');
        });

        it('does not allow left -> active', () => {
            expect(() =>
                transitionState('Participant', 'left', 'active', PARTICIPANT_TRANSITIONS),
            ).toThrow(InvalidStateTransitionError);
        });
    });

    describe('File upload', () => {
        it('allows uploading -> available', () => {
            expect(
                transitionState('FileTransfer', 'uploading', 'available', FILE_UPLOAD_TRANSITIONS),
            ).toBe('available');
        });

        it('does not allow failed -> uploading', () => {
            expect(() =>
                transitionState('FileTransfer', 'failed', 'uploading', FILE_UPLOAD_TRANSITIONS),
            ).toThrow(InvalidStateTransitionError);
        });
    });

    describe('File delivery', () => {
        it('allows streaming -> completed', () => {
            expect(
                transitionState('FileDelivery', 'streaming', 'completed', FILE_DELIVERY_TRANSITIONS),
            ).toBe('completed');
        });

        it('does not allow completed -> streaming', () => {
            expect(
                canTransition('completed', 'streaming', FILE_DELIVERY_TRANSITIONS),
            ).toBe(false);
        });
    });

    describe('Stream connection', () => {
        it('allows opening -> active', () => {
            expect(
                transitionState('StreamConnection', 'opening', 'active', STREAM_CONNECTION_TRANSITIONS),
            ).toBe('active');
        });

        it('does not allow completed -> aborted', () => {
            expect(() =>
                transitionState('StreamConnection', 'completed', 'aborted', STREAM_CONNECTION_TRANSITIONS),
            ).toThrow(InvalidStateTransitionError);
        });
    });
});
