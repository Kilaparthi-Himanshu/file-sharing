import {
    createFileStartMessage, 
    createFileEndMessage, 
    encodeControlMessage, 
    encodeChunkFrame,
    TransferMessage,
    FRAME_HEADER_BYTES
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
    private static readonly DEFAULT_CHUNK_SIZE = 512 * 1024;
    private static readonly BUFFER_HIGH_WATERMARK = 2 * 1024 * 1024;
    private static readonly BUFFER_LOW_WATERMARK = 512 * 1024;

    private readonly cancelledFiles = new Set<string>();

    private static readonly INITIAL_WINDOW = 1 * 1024 * 1024;

    private readonly acked = new Map<string, number>();

    private ackWaiter: (() => void) | null = null;

    private nextFileSeq = 1;
    private nextLane = 0;

    constructor(
        private readonly peer: InstantPeer,
        private readonly callbacks: TransferCallbacks = {},
        private readonly config: { maxWindow: number, chunkSize: number },
    ) {}

    cancelFile(fileId: string): void {
        this.cancelledFiles.add(fileId);
    }

    handleAck(fileId: string, bytes: number): void {
        this.acked.set(
            fileId,
            Math.max(
                this.acked.get(fileId) ?? 0,
                bytes
            )
        );

        this.ackWaiter?.();
        this.ackWaiter = null;

        // console.log(
        //     "[TransferManager] ACK:",
        //     JSON.stringify({
        //         fileId,
        //         bytes,
        //     })
        // );
    }

    async sendFile(fileId: string, file: File): Promise<void> {
        const statsInterval = window.setInterval(() => {
            void this.peer.logDataChannelStats();
        }, 1000);

        try {
            const transferStartedAt = performance.now();

            if (this.cancelledFiles.has(fileId)) {
                this.cancelledFiles.delete(fileId);
                this.acked.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            console.log(
                "[TransferManager] FILE START:",
                file.name,
                file.size
            );

            const seq = this.nextFileSeq++;

            if (this.nextFileSeq > 0xffffffff) {
                throw new Error("File sequence number exhausted");
            }

            this.sendControl(
                createFileStartMessage(fileId, file, seq),
            );

            const maxMessageSize = this.peer.maxMessageSize;

            const chunkSize =
                maxMessageSize !== null
                    ? Math.min(
                        // TransferManager.DEFAULT_CHUNK_SIZE,
                        this.config.chunkSize,
                        maxMessageSize - FRAME_HEADER_BYTES
                    )
                    // : TransferManager.DEFAULT_CHUNK_SIZE;
                    : this.config.chunkSize;

            console.log(
                "[TransferManager] CHUNK CONFIG:",
                {
                    selectedChunkSize: this.config.chunkSize,
                    selectedChunkSizeKiB: (
                        this.config.chunkSize / 1024
                    ).toFixed(0),
                    maxMessageSize,
                    effectiveChunkSize: chunkSize,
                    effectiveChunkSizeKiB: (
                        chunkSize / 1024
                    ).toFixed(0),
                }
            );

            let offset = 0;

            let lastRateLogTime = performance.now();
            let lastRateLogBytes = 0;

            while (offset < file.size) {
                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.acked.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                await this.waitForWindow(fileId, offset);

                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.acked.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                const lane = await this.waitForAvailableLane();

                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.acked.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                const end = Math.min(
                    offset + chunkSize,
                    file.size
                );

                const chunk = await file
                    .slice(offset, end)
                    .arrayBuffer();

                if (this.cancelledFiles.has(fileId)) {
                    this.cancelledFiles.delete(fileId);
                    this.acked.delete(fileId);
                    this.callbacks.onCancelled?.(fileId);
                    return;
                }

                this.peer.sendOnLane(lane, encodeChunkFrame(seq, offset, chunk));

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
                            lane0BufferedMB: (
                                this.peer.getLaneBufferedAmount(0) /
                                1024 /
                                1024
                            ).toFixed(2),
                            lane1BufferedMB: (
                                this.peer.getLaneBufferedAmount(1) /
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
                this.acked.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            await Promise.all(
                Array.from(
                    { length: this.peer.laneCount },
                    (_, lane) => this.peer.waitForLaneDrain(lane),
                )
            );

            if (this.cancelledFiles.has(fileId)) {
                this.cancelledFiles.delete(fileId);
                this.acked.delete(fileId);
                this.callbacks.onCancelled?.(fileId);
                return;
            }

            const elapsedSeconds = (performance.now() - transferStartedAt) / 1000;

            console.log(
                "[TransferManager] FILE TIMING:",
                {
                    fileName: file.name,
                    fileSizeBytes: file.size,
                    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
                    averageMbps: Number(
                        (
                            (file.size * 8) /
                            (elapsedSeconds * 1_000_000)
                        ).toFixed(2)
                    ),
                }
            );

            console.log(
                "[TransferManager] FILE END:",
                fileId
            );

            this.sendControl(createFileEndMessage(fileId));

            this.acked.delete(fileId);

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

    private async waitForWindow(
        fileId: string,
        offset: number,
    ): Promise<void> {
        while (true) {
            const acked = this.acked.get(fileId) ?? 0;

            const window = Math.min(
                // TransferManager.MAX_WINDOW,
                this.config.maxWindow,
                TransferManager.INITIAL_WINDOW + acked
            );

            // console.log(
            //     "Max Window Value: ", this.config.maxWindow, "Choosen Window value: ", window
            // );

            if (offset - acked < window) return;

            if (this.cancelledFiles.has(fileId)) return;

            if (this.peer.state !== "connected") {
                throw new Error("Peer disconnected");
            }

            // console.log(
            //     "[TransferManager] ACK WINDOW WAIT:",
            //     JSON.stringify({
            //         fileId,
            //         offset,
            //         acked,
            //         inFlight: offset - acked,
            //         window,
            //     })
            // );

            await new Promise<void>((resolve) => {
                this.ackWaiter = resolve;

                setTimeout(resolve, 500);
            });
        }
    }

    private async waitForAvailableLane(): Promise<number> {
        const laneCount = this.peer.laneCount;

        if (laneCount < 1) {
            throw new Error("No available DataChannels");
        }

        while (true) {
            const preferredLane = this.nextLane % laneCount;

            // Check lanes in round-robin order.
            for (let i = 0; i < laneCount; i++) {
                const lane = (preferredLane + i) % laneCount;

                const bufferedAmount = this.peer.getLaneBufferedAmount(lane);

                if (bufferedAmount < TransferManager.BUFFER_HIGH_WATERMARK) {
                    this.nextLane = (lane + 1) % laneCount;

                    return lane;
                }
            }

            // Every lane is congested. Wait until at least one
            // lane's buffered amount drops below its low watermark.
            const start = performance.now();

            await Promise.race(
                Array.from(
                    { length: laneCount },
                    (_, lane) => {
                        this.peer.setLaneBufferedAmountLowThreshold(
                            lane,
                            TransferManager.BUFFER_LOW_WATERMARK,
                        );

                        return this.peer.waitForLaneBufferedAmountLow(lane);
                    },
                )
            );

            console.log("[TransferManager] LANE BACKPRESSURE RELEASED", {
                durationMs: Math.round(performance.now() - start),
            });
        }
    }
}
