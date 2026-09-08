import {
    decodeControlMessage,
    FileEndMessage,
    FileStartMessage
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
    onComplete?: (file: ReceivedFile) => void;
    onAbort?: (files: { receptionId: string; fileId: string }[]) => void;
    onCancel?: (receptionId: string, fileId: string) => void;
    onError?: (error: Error) => void;
}

type IncomingFile = {
    receptionId: string;
    id: string;
    name: string;
    mimeType: string;
    size: number;
    chunks: Blob[];
    bytesReceived: number;
}

export class TransferReceiver {
    private readonly files = new Map<string, IncomingFile>();

    private readonly cancelledFiles = new Set<string>();

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

        this.cancelledFiles.delete(message.fileId);

        const file: IncomingFile = {
            receptionId: crypto.randomUUID(),
            id: message.fileId,
            name: message.name,
            mimeType: message.mimeType,
            size: message.size,
            chunks: [],
            bytesReceived: 0,
        }

        this.files.set(message.fileId, file);

        this.callbacks.onFileStart?.(file.receptionId, message);
    }

    private async handleChunk(data: ArrayBuffer | Blob): Promise<void> {
        const file = this.getCurrentFile();

        if (!file) {
            return;
        }

        const chunk =
            data instanceof Blob
                ? data
                : new Blob([data]);

        file.chunks.push(chunk);

        file.bytesReceived += chunk.size;

        console.log(
            "[TransferReceiver] CHUNK RECEIVED:",
            file.bytesReceived,
            "/",
            file.size
        );

        this.callbacks.onProgress?.(
            file.receptionId,
            file.id,
            file.bytesReceived,
            file.size,
            file.size === 0
                ? 100
                : (file.bytesReceived / file.size) * 100,
        );
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

        if (file.bytesReceived !== file.size) {
            throw new Error(
                `Incomplete file ${file.name}` +
                `${file.bytesReceived}/${file.size} bytes received`
            );
        }

        console.log(
            "[TransferReceiver] FILE END:",
            file.name,
            file.bytesReceived,
            "/",
            file.size
        );

        const blob = new Blob(
            file.chunks,
            {
                type: file.mimeType,
            },
        );

        console.log(
            "[TransferReceiver] BLOB CREATED:",
            blob.size,
            blob.type
        );

        this.callbacks.onComplete?.({
            receptionId: file.receptionId,
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            blob,
        });

        this.files.delete(message.fileId);
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

        file.chunks.length = 0;

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
        this.cancelledFiles.clear();
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
        this.cancelledFiles.clear();
    }

    get debugMemory(): {
        activeFiles: number;
        activeChunks: number;
        activeBytes: number;
    } {
        let activeChunks = 0;
        let activeBytes = 0;

        for (const file of this.files.values()) {
            activeChunks += file.chunks.length;
            activeBytes += file.bytesReceived;
        }

        return {
            activeFiles: this.files.size,
            activeChunks,
            activeBytes,
        }
    }
}
