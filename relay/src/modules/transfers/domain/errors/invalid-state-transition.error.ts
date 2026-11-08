export class InvalidStateTransitionError extends Error {
    constructor(
        public readonly entity: string,
        public readonly currentState: string,
        public readonly requestedState: string,
    ) {
        super(`Invalid ${entity} transition: ${currentState} -> ${requestedState}`,);

        this.name = 'InvalidStateTransitionError';
    }
}
