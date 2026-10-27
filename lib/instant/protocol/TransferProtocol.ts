export type TransferMessage =
    | FileStartMessage
    | FileEndMessage
    | FileCancelMessage
    | TransferEndMessage
    | FileAckMessage;

export type FileStartMessage = {
    type: "file-start";
    fileId: string;
    seq: number;
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

export type FileAckMessage = {
    type: "file-ack";
    fileId: string;
    bytes: number;
}

export type TransferEndMessage = {
    type: "transfer-end";
}

export const FRAME_HEADER_BYTES = 12;

// Frame layout:
// [0..3]   file sequence number (uint32)
// [4..11]  byte offset (float64)
// [12..]   raw chunk payload
export type DecodedChunkFrame = {
    seq: number;
    offset: number;
    payload: ArrayBuffer;
}

export function encodeChunkFrame(
    seq: number,
    offset: number,
    payload: ArrayBuffer,
) {
    if (!Number.isInteger(seq) || seq < 0 || seq > 0xffffffff) { // 0xffffffff represents the maximum value for a 32-bit unsigned integer
        throw new Error(`Invalid file sequence ${seq}`);
    }

    if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new Error(`Invalid chunk offset ${offset}`);
    }

    const frame = new ArrayBuffer(
        FRAME_HEADER_BYTES + payload.byteLength,
    );

    const view = new DataView(frame);

    view.setUint32(0, seq);
    view.setFloat64(4, offset);

    new Uint8Array(frame, FRAME_HEADER_BYTES).set(
        new Uint8Array(payload),
    );

    return frame;
}

export function decodeChunkFrame(
    frame: ArrayBuffer
): DecodedChunkFrame {
    if (frame.byteLength < FRAME_HEADER_BYTES) {
        throw new Error("Binary frame is smaller than its header");
    }

    const view = new DataView(frame);

    return {
        seq: view.getUint32(0),
        offset: view.getFloat64(4),
        payload: frame.slice(FRAME_HEADER_BYTES),
    }
}

export function createFileStartMessage(fileId: string, file: File, seq: number): FileStartMessage {
    return {
        type: "file-start",
        fileId,
        seq,
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

export function createTransferEndMessage(): TransferEndMessage {
    return {
        type: "transfer-end",
    }
}

export function encodeControlMessage(message: TransferMessage): string {
    return JSON.stringify(message);
}

export function decodeControlMessage(data: string): TransferMessage {
    return JSON.parse(data) as TransferMessage;
}
