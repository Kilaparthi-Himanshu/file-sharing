import type {
    FileStartMessage,
} from "./protocol/TransferProtocol";

import type {
    TransferProgress as SendTransferProgress,
} from "./TransferManager";

export type InstantRole = "sender" | "receiver";

export type SignalType = 
    | "join"
    | "offer"
    | "answer"
    | "ice-candidate"
    | "leave";

export type SignalMessage = {
    type: SignalType;
    from: string;
    to?: string;

    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

export type InstantSessionStatus = 
    | "idle"
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";

export type ReceivedFile = {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    blob: Blob;
}

export type InstantSessionCallbacks = {
    onSessionCreated?: (id: string) => void;
    onPeerConnected?: (peerId: string, connectedPeers: number) => void;
    onPeerDisconnected?: (peerId: string, connectedPeers: number) => void;
    onStatusChange?: (status: InstantSessionStatus) => void;
    onError?: (error: Error) => void;
    /**
     * Sender-side progress.
     */
    onSendProgress?: (peerId: string, progress: SendTransferProgress) => void;
    /**
     * Fired when one file has been completely
     * sent to one receiver.
     */
    onFileSent?: (peerId: string, fileId: string) => void;
    /**
     * Receiver-side file metadata.
     */
    onFileStart?: (file: FileStartMessage) => void;
    /**
     * Receiver-side progress.
     */
    onReceiverProgress?: (
        fileId: string,
        bytesReceived: number,
        totalBytes: number,
        progress: number
    ) => void;
    /**
     * Receiver-side completed file.
     */
    onFileCompleted?: (file: ReceivedFile) => void;
    onFileReceived?: (file: ReceivedFile) => void;
}

export function generateTransferId(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const values = new Uint32Array(6);
    crypto.getRandomValues(values);

    return Array.from(values, value => {
        return characters[value % characters.length];
    }).join("");
}

export function generatePeerId(): string {
    return crypto.randomUUID();
}
