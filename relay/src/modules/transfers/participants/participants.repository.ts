import type { Participant } from "../domain";

export const PARTICIPANTS_REPOSITORY = Symbol(
  'PARTICIPANTS_REPOSITORY',
);

export interface ParticipantsRepository {
    create(participant: Participant): Promise<Participant>;

    findById(id: string): Promise<Participant | null>;

    findBySessionId(sessionId: string): Promise<Participant[]>;

    findSenderBySessionId(sessionId: string): Promise<Participant | null>;

    update(participant: Participant): Promise<Participant>;

    delete(id: string): Promise<void>;
}
