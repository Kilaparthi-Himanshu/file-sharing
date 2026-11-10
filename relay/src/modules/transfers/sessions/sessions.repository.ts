import { TransferSession } from "../domain";

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface SessionsRepository {
    create(session: TransferSession): Promise<TransferSession>;

    findById(id: string): Promise<TransferSession | null>;

    update(session: TransferSession): Promise<TransferSession>;

    delete(id: string): Promise<void>;
}
