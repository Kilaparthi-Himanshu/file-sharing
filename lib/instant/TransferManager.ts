import {
    createFileStartMessage, 
    createFileEndMessage, 
    encodeControlMessage, 
    TransferMessage
} from "./protocol/TransferProtocol";

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
    onCancelled?: (fileId: string) => void;
    onError?: (error: Error) => void;
}

export class TransferManager {
    private static readonly CHUNK_SIZE = 256 * 1024;

    private static readonly BUFFER_HIGH_WATERMARK = 4 * 1024 * 1024;

    private static readonly BUFFER_LOW_WATERMARK = 1 * 1024 * 1024;

    private readonly cancelledFiles = new Set<string>();

    constructor(
        private readonly peer: InstantPeer,
        private readonly callbacks: TransferCallbacks = {},
    ) {}

    cancelFile(fileId: string): void {
        this.cancelledFiles.add(fileId);
    }

    async sendFile(fileId: string, file: File): Promise<void> {
        const statsInterval = window.setInterval(() => {
            void this.peer.logSelectedCandidatePair(false);
            void this.peer.logDataChannelStats();
        }, 1000);

        try {
            if (this.cancelledFiles.has(fileId)) {
                this.cancelledFiles.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            console.log(
                "[TransferManager] FILE START:",
                file.name,
                file.size
            );

            this.sendControl(createFileStartMessage(fileId, file));

            let offset = 0;

            let lastRateLogTime = performance.now();
            let lastRateLogBytes = 0;

            while (offset < file.size) {
                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                await this.waitForBuffer();

                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                const end = Math.min(
                    offset + TransferManager.CHUNK_SIZE,
                    file.size
                );

                const chunk = await file
                    .slice(offset, end)
                    .arrayBuffer();

                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                this.peer.send(chunk);

                // console.log(
                //     "[TransferManager] CHUNK SENT:",
                //     // offset,
                //     // "/",
                //     // file.size
                //     {
                //         offset,
                //         total: file.size,
                //         progress: offset / file.size,
                //         bufferedAmount: this.peer.bufferedAmount,
                //     }
                // );

                offset = end;

                // Temporary transfer-rate diagnostics
                const now = performance.now();

                if (now - lastRateLogTime >= 1000) {
                    const bytesSinceLastLog = offset - lastRateLogBytes;
                    const seconds = (now - lastRateLogTime) / 1000;

                    const mbps =
                        (bytesSinceLastLog * 8) /
                        seconds /
                        1_000_000;

                    console.log(
                        "[TransferManager] RATE:",
                        {
                            mbps: mbps.toFixed(2),
                            bufferedMB: (
                                this.peer.bufferedAmount /
                                1024 /
                                1024
                            ).toFixed(2),
                            progress: (
                                (offset / file.size) *
                                100
                            ).toFixed(2),
                        }
                    );

                    lastRateLogTime = now;
                    lastRateLogBytes = offset;
                }

                this.callbacks.onProgress?.({
                    fileId,
                    bytesSent: offset,
                    totalBytes: file.size,
                    progress: file.size === 0
                        ? 100
                        : (offset / file.size) * 100,
                });
            }

            if (this.cancelledFiles.has(fileId)) {
                this.cancelledFiles.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            await this.waitForBuffer();

            if (this.cancelledFiles.has(fileId)) {
                this.cancelledFiles.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            console.log(
                "[TransferManager] FILE END:",
                fileId
            );

            this.sendControl(createFileEndMessage(fileId));

            this.callbacks.onComplete?.(fileId);
        } catch (error) {
            const normailzedError =
                error instanceof Error
                    ? error
                    : new Error(String(error));

            this.callbacks.onError?.(normailzedError);

            throw normailzedError;
        } finally {
            window.clearInterval(statsInterval);
        }
    }

    private sendControl(message: TransferMessage): void {
        this.peer.send(encodeControlMessage(message));
    }

    private async waitForBuffer(): Promise<void> {
        if (this.peer.bufferedAmount <= TransferManager.BUFFER_HIGH_WATERMARK) {
            return;
        }

        this.peer.setBufferedAmountLowThreshold(TransferManager.BUFFER_LOW_WATERMARK);

        console.log(
            "[TransferManager] BACKPRESSURE START",
            {
                bufferedAmount: this.peer.bufferedAmount,
                highWatermark: TransferManager.BUFFER_HIGH_WATERMARK,
            }
        );

        const start = performance.now();

        await this.peer.waitForBufferedAmountLow();

        console.log(
            "[TransferManager] BACKPRESSURE END",
            {
                bufferedAmount: this.peer.bufferedAmount,
                durationMs: Math.round(performance.now() - start)
            }
        );
    }
}
