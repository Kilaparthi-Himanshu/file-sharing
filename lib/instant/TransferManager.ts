import {
    createFileStartMessage, 
    createFileEndMessage, 
    encodeControlMessage, 
    TransferMessage
} from "./protocal/TransferProtocol";

import { InstantPeer } from "./InstantPeer";

export type TransferProgress = {
    fileId: string;
    bytesSent: number;
    totalBytes: number;
    progress: number;
}

export type TransferCallbacks = {
    onProgress?: (progress: TransferProgress) => void;
    onComplete?: (fileId: string) => void;
    onError?: (error: Error) => void;
}

export class TransferManager {
    private static readonly CHUNK_SIZE = 256 * 1024;

    private static readonly BUFFER_HIGH_WATERMARK = 4 * 1024 * 1024;

    private static readonly BUFFER_LOW_WATERMARK = 1 * 1024 * 1024;

    constructor(
        private readonly peer: InstantPeer,
        private readonly callbacks: TransferCallbacks = {},
    ) {}

    async sendFile(fileId: string, file: File): Promise<void> {
        try {
            this.sendControl(createFileStartMessage(fileId, file));

            let offset = 0;

            while (offset < file.size) {
                await this.waitForBuffer();

                const end = Math.min(
                    offset + TransferManager.CHUNK_SIZE,
                    file.size
                );

                const chunk = await file
                    .slice(offset, end)
                    .arrayBuffer();

                this.peer.send(chunk);

                offset = end;

                this.callbacks.onProgress?.({
                    fileId,
                    bytesSent: offset,
                    totalBytes: file.size,
                    progress: file.size === 0
                        ? 100
                        : (offset / file.size) * 100,
                });
            }

            await this.waitForBuffer();

            this.sendControl(createFileEndMessage(fileId));

            this.callbacks.onComplete?.(fileId);
        } catch (error) {
            const normailzedError =
                error instanceof Error
                    ? error
                    : new Error(String(error));

            this.callbacks.onError?.(normailzedError);

            throw normailzedError;
        }
    }

    private sendControl(message: TransferMessage): void {
        this.peer.send(encodeControlMessage(message));
    }

    private async waitForBuffer(): Promise<void> {
        if (this.peer.bufferedAmount <= TransferManager.BUFFER_HIGH_WATERMARK) {
            return;
        }

        await new Promise<void>((resolve) => {
            const checkBuffer = () => {
                if (this.peer.bufferedAmount <= TransferManager.BUFFER_LOW_WATERMARK) {
                    resolve();
                    return;
                }

                requestAnimationFrame(checkBuffer);
            }

            checkBuffer();
        });
    }
}
