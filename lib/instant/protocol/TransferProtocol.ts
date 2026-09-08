export type TransferMessage =
    | FileStartMessage
    | FileEndMessage
    | FileCancelMessage;

export type FileStartMessage = {
    type: "file-start";
    fileId: string;
    name: string;
    mimeType: string;
    size: number;
}

export type FileEndMessage = {
    type: "file-end";
    fileId: string;
}

export type FileCancelMessage = {
    type: "file-cancel";
    fileId: string;
}

export function createFileStartMessage(fileId: string, file: File,): FileStartMessage {
    return {
        type: "file-start",
        fileId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
    }
}

export function createFileEndMessage(fileId: string): FileEndMessage {
    return {
        type: "file-end",
        fileId,
    }
}

export function createFileCancelMessage(fileId: string): FileCancelMessage {
    return {
        type: "file-cancel",
        fileId,
    }
}

export function encodeControlMessage(message: TransferMessage): string {
    return JSON.stringify(message);
}

export function decodeControlMessage(data: string): TransferMessage {
    return JSON.parse(data) as TransferMessage;
}
