import {
    decodeControlMessage,
    FileEndMessage,
    FileStartMessage
} from "./protocal/TransferProtocol";

export type ReceivedFile = {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    blob: Blob;
}

export type TransferReceiverCallbacks = {
    onFileStart?: (file: FileStartMessage) => void;
    onProgress?: (
        fileId: string,
        bytesReceived: number,
        totalBytes: number,
        progress: number,
    ) => void;
    onComplete?: (file: ReceivedFile) => void;
    onError?: (error: Error) => void;
}

type IncomingFile = {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    chunks: Blob[];
    bytesReceived: number;
}

export class TransferReceiver {
    private readonly files = new Map<string, IncomingFile>();

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
                        return;

                    case "file-end":
                        await this.handleFileEnd(message);
                        return;
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

        const file: IncomingFile = {
            id: message.fileId,
            name: message.name,
            mimeType: message.mimeType,
            size: message.size,
            chunks: [],
            bytesReceived: 0,
        }

        this.files.set(message.fileId, file);

        this.callbacks.onFileStart?.(message);
    }

    private async handleChunk(data: ArrayBuffer | Blob): Promise<void> {
        const file = this.getCurrentFile();

        const chunk =
            data instanceof Blob
                ? data
                : new Blob([data]);

        file.chunks.push(chunk);

        file.bytesReceived += chunk.size;

        this.callbacks.onProgress?.(
            file.id,
            file.bytesReceived,
            file.size,
            file.size === 0
                ? 100
                : (file.bytesReceived / file.size) * 100,
        );
    }

    private async handleFileEnd(message: FileEndMessage): Promise<void> {
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

        const blob = new Blob(
            file.chunks,
            {
                type: file.mimeType,
            },
        );

        this.callbacks.onComplete?.({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            blob,
        });

        this.files.delete(message.fileId);
    }

    private getCurrentFile(): IncomingFile {
        const files = Array.from(this.files.values());

        const file = files[files.length - 1];

        if (!file) {
            throw new Error("Received file data before file-start");
        }

        return file;
    }

    reset(): void {
        this.files.clear();
    }
}
