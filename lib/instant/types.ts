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

export type InstantSessionCallbacks = {
    onSessionCreated?: (id: string) => void;
    onPeerConnected?: (peerId: string, connectedPeers: number) => void;
    onPeerDisconnected?: (peerId: string, connectedPeers: number) => void;
    onStatusChange?: (status: InstantSessionStatus) => void;
    onError?: (error: Error) => void;
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
