import {
    decodeControlMessage,
    decodeChunkFrame,
    FRAME_HEADER_BYTES,
    FileEndMessage,
    FileStartMessage,
    FileCancelMessage,
} from "./protocol/TransferProtocol";

import { ReceivedFile } from "./types";

export type TransferReceiverCallbacks = {
    onFileStart?: (receptionId: string, file: FileStartMessage) => void;
    onProgress?: (
        receptionId: string,
        fileId: string,
        bytesReceived: number,
        totalBytes: number,
        progress: number,
    ) => void;
    onAck?: (fileId: string, bytes: number) => void;
    onComplete?: (file: ReceivedFile) => void;
    onTransferComplete?: () => void;
    onAbort?: (files: { receptionId: string; fileId: string }[]) => void;
    onCancel?: (receptionId: string, fileId: string) => void;
    onError?: (error: Error) => void;
}

type IncomingFile = {
    receptionId: string;
    id: string;
    seq: number;
    name: string;
    mimeType: string;
    size: number;

    // Each chunk is stored at its original byte offset.
    chunks: Map<number, Blob>;

    // Count of unique payload bytes received.
    bytesReceived: number;

    // Highest contiguous byte offset acknowledged.
    lastAcked: number;

    // file-end may arrive before all data in a future multi-lane setup.
    endReceived: boolean;
}

export class TransferReceiver {
    private readonly files = new Map<string, IncomingFile>();

    private readonly cancelledFiles = new Set<string>();

    private readonly bySeq = new Map<number, IncomingFile>();

    private readonly earlyFrames = new Map<
        number,
        { offset: number; payload: Blob }[]
    >

    private transferEnded = false;

    private readonly cancelledSeqs = new Set<number>();

    constructor(
        private readonly callbacks: TransferReceiverCallbacks = {}
    ) {}

    async handleData(data: string | ArrayBuffer | Blob): Promise<void> {
        try {
            if (typeof data === "string") {
                const message = decodeControlMessage(data);

                switch (message.type) {
                    case "file-start":
                        this.handleFileStart(message);

                        console.log(
                            "[TransferReceiver] FILE START:",
                            message.name,
                            message.size
                        );

                        return;

                    case "file-end":
                        await this.handleFileEnd(message);
                        return;

                    case "transfer-end":
                        this.handleTransferEnd();
                        return;

                    case "file-cancel":
                        this.handleFileCancel(message as FileCancelMessage);
                        return;

                    default:
                        throw new Error("Invalid transfer control message");
                }
            }

            await this.handleChunk(data);
        } catch (error) {
            const normailzedError =
                error instanceof Error
                    ? error
                    : new Error(String(error));

            this.callbacks.onError?.(normailzedError);

            throw normailzedError;
        }
    }

    private handleFileStart(message: FileStartMessage): void {
        if (this.files.has(message.fileId)) {
            throw new Error(`File already exists: ${message.fileId}`);
        }

        if ((!Number.isInteger(message.seq) ||
        message.seq < 1 ||
        message.seq > 0xffffffff)) {
            throw new Error(`Invalid file sequence: ${message.seq}`);
        }

        if (this.bySeq.has(message.seq)) {
            throw new Error(`File sequence already exists: ${message.seq}`);
        }

        if (!Number.isSafeInteger(message.size) || message.size < 0) {
            throw new Error(`Invalid file size: ${message.size}`);
        }

        this.cancelledFiles.delete(message.fileId);

        const file: IncomingFile = {
            receptionId: crypto.randomUUID(),
            id: message.fileId,
            seq: message.seq,
            name: message.name,
            mimeType: message.mimeType,
            size: message.size,
            chunks: new Map(),
            bytesReceived: 0,
            lastAcked: 0,
            endReceived: false,
        }

        this.files.set(file.id, file);
        this.bySeq.set(file.seq, file);

        this.callbacks.onFileStart?.(file.receptionId, message);

        // A frame from another lane can arrive before file-start
        const early = this.earlyFrames.get(file.seq) ?? [];
        this.earlyFrames.delete(file.seq);

        for (const chunk of early) {
            this.addChunk(file, chunk.offset, chunk.payload);
        }

        this.tryFinish(file);
    }

    private async handleChunk(data: ArrayBuffer | Blob): Promise<void> {
        if (!(data instanceof ArrayBuffer)) {
            throw new Error("Expected an ArrayBuffer binary frame");
        }

        const frame = decodeChunkFrame(data);

        if (this.cancelledSeqs.has(frame.seq)) {
            return;
        }

        const payload = new Blob([frame.payload]);
        const file = this.bySeq.get(frame.seq);

        if (!file) {
            // Limit early data so unknown sequence numbers cannot grow
            // memory without bound. Tune this only if testing requires it.
            const earlyCount = Array.from(this.earlyFrames.values())
                .reduce((total, list) => total + list.length, 0);

            if (earlyCount >= 64) {
                throw new Error("Too many chunks arrived before file-start");
            }

            const list = this.earlyFrames.get(frame.seq) ?? [];
            list.push({ offset: frame.offset, payload });
            this.earlyFrames.set(frame.seq, list);
            return;
        }

        this.addChunk(file, frame.offset, payload);
    }

    private addChunk(
        file: IncomingFile,
        offset: number,
        payload: Blob,
    ): void {
        const end = offset + payload.size;

        if (
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            end > file.size
        ) {
            throw new Error(`Chunk range is outside file bounds: ${offset}-${end}`);
        }

        // Empty files have no data frames.
        if (payload.size === 0) {
            return;
        }

        // Exact duplicate range: ignore it without counting bytes twice.
        const existing = file.chunks.get(offset);

        if (existing) {
            if (existing.size === payload.size) {
                return;
            }

            throw new Error(`Conflicting duplicate chunk at offset ${offset}`);
        }

        // Reject partial overlaps; otherwise the resulting file could
        // silently contain duplicated or overwritten bytes.
        for (const [existingOffset, existingChunk] of file.chunks) {
            const existingEnd = existingOffset + existingChunk.size;

            if (offset < existingEnd && end > existingOffset) {
                throw new Error(
                    `Overlapping chunks: ${offset}-${end} and ` +
                    `${existingOffset}-${existingEnd}`,
                );
            }
        }

        file.chunks.set(offset, payload);
        file.bytesReceived += payload.size;

        // ACK only the contiguous prefix [0, N), not the total bytes
        // received out of order.
        const contiguousBytes = this.getContiguousBytes(file);

        if (
            contiguousBytes - file.lastAcked >= 256 * 1024 ||
            contiguousBytes === file.size
        ) {
            file.lastAcked = contiguousBytes;
            this.callbacks.onAck?.(file.id, contiguousBytes);
        }

        this.callbacks.onProgress?.(
            file.receptionId,
            file.id,
            file.bytesReceived,
            file.size,
            file.size === 0
                ? 100
                : (file.bytesReceived / file.size) * 100,
        );

        this.tryFinish(file);
    }

    private getContiguousBytes(file: IncomingFile): number {
        let nextOffset = 0;

        const sorted = Array.from(file.chunks.entries())
            .sort(([a], [b]) => a - b);

        for (const [offset, chunk] of sorted) {
            if (offset !== nextOffset) {
                break;
            }

            nextOffset += chunk.size;
        }

        return nextOffset;
    }

    private async handleFileEnd(message: FileEndMessage): Promise<void> {
        if (this.cancelledFiles.has(message.fileId)) {
            this.cancelledFiles.delete(message.fileId);
            return;
        }

        const file = this.files.get(message.fileId);

        if (!file) {
            throw new Error(`Unknown file: ${message.fileId}`);
        }

        file.endReceived = true;
        this.tryFinish(file);
    }

    private tryFinish(file: IncomingFile): void {
        if (!file.endReceived) {
            return;
        }

        if (file.bytesReceived !== file.size) {
            return;
        }

        if (this.getContiguousBytes(file) !== file.size) {
            return;
        }

        const parts = Array.from(file.chunks.entries())
            .sort(([a], [b]) => a - b)
            .map(([, chunk]) => chunk);

        const blob = new Blob(parts, {
            type: file.mimeType,
        });

        if (blob.size !== file.size) {
            throw new Error(
                `Reassembled file size mismatch: ${blob.size}/${file.size}`,
            );
        }

        this.files.delete(file.id);
        this.bySeq.delete(file.seq);
        this.cancelledSeqs.delete(file.seq);

        this.callbacks.onComplete?.({
            receptionId: file.receptionId,
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            blob,
        });

        this.maybeFinishTransfer();
    }

    private handleTransferEnd(): void {
        this.transferEnded = true;
        this.maybeFinishTransfer();
    }

    private maybeFinishTransfer(): void {
        if (!this.transferEnded || this.files.size > 0) {
            return;
        }

        // Unknown early frames mean the transfer is not fully resolved.
        if (this.earlyFrames.size > 0) {
            return;
        }

        this.transferEnded = false;
        this.callbacks.onTransferComplete?.();
    }

    private handleFileCancel(message: FileCancelMessage): void {
        const file = this.files.get(message.fileId);

        if (file) {
            this.files.delete(file.id);
            this.bySeq.delete(file.seq);
            this.cancelledSeqs.add(file.seq);

            this.callbacks.onCancel?.(
                file.receptionId,
                file.id
            );
        }

        this.maybeFinishTransfer();
    }

    cancelFile(receptionId: string): void {
        const entry = Array.from(
            this.files.entries()
        ).find(
            ([, file]) =>
                file.receptionId === receptionId,
        );

        if (!entry) {
            return;
        }

        const [fileId, file] = entry;

        this.files.delete(fileId);


        file.chunks.clear();
        this.bySeq.delete(file.seq);
        this.cancelledSeqs.add(file.seq);
        this.earlyFrames.delete(file.seq);

        this.cancelledFiles.add(fileId);

        this.callbacks.onCancel?.(
            file.receptionId,
            file.id
        );
    }

    private getCurrentFile(): IncomingFile | null {
        const files = Array.from(this.files.values());

        return files[files.length - 1] ?? null;

        // if (!file) {
        //     throw new Error("Received file data before file-start");
        // }

        // return file;
    }

    reset(): void {
        this.files.clear();
        this.bySeq.clear();
        this.earlyFrames.clear();
        this.cancelledFiles.clear();
        this.cancelledSeqs.clear();
        this.transferEnded = false;
    }

    abort(): void {
        if (this.files.size === 0) {
            return;
        }

        const interruptedFiles = Array.from(
            this.files.values()
        ).map((file) => ({
            receptionId: file.receptionId,
            fileId: file.id,
        }));

        this.callbacks.onAbort?.(interruptedFiles);

        this.files.clear();
        this.bySeq.clear();
        this.earlyFrames.clear();
        this.cancelledFiles.clear();
        this.cancelledSeqs.clear();
        this.transferEnded = false;
    }

    get debugMemory(): {
        activeFiles: number;
        activeChunks: number;
        activeBytes: number;
    } {
        let activeChunks = 0;
        let activeBytes = 0;

        for (const file of this.files.values()) {
            activeChunks += file.chunks.size;
            activeBytes += file.bytesReceived;
        }

        return {
            activeFiles: this.files.size,
            activeChunks,
            activeBytes,
        }
    }
}
