import { InstantPeer } from "./InstantPeer";
import { SignalingClient } from "./SingalingClient";
import {
    generatePeerId,
    generateTransferId,
    InstantRole,
    InstantSessionCallbacks,
    InstantSessionStatus,
    SignalMessage,
} from "./types";

export class InstantSession {
    private readonly peerId: string;
    private readonly role: InstantRole;

    private transferId: string | null = null;
    private signaling: SignalingClient | null = null;

    private readonly peers = new Map<string, InstantPeer>();
    private readonly connectedPeers = new Set<string>();

    private status: InstantSessionStatus = "idle";

    constructor(
        role: InstantRole,
        private readonly callbacks: InstantSessionCallbacks = {}
    ) {
        this.role = role;
        this.peerId = generatePeerId();
    }

    async create(): Promise<string> {
        if (this.role !== "sender") {
            throw new Error(
                "Only a sender can create and Instant session"
            );
        }

        if (this.transferId) {
            return this.transferId;
        }

        this.transferId = generateTransferId();

        await this.connectSignaling();

        this.setStatus("connecting");

        this.callbacks.onSessionCreated?.(
            this.transferId
        );

        return this.transferId;
    }

    async join(transferId: string): Promise<void> {
        if (this.role !== "receiver") {
            throw new Error(
                "Only a receiver can join an instant session"
            );
        }

        if (!transferId) {
            throw new Error(
                "Transfer ID is required"
            );
        }

        this.transferId = transferId.toUpperCase();

        await this.connectSignaling();

        this.setStatus("connecting");

        await this.signaling!.send({
            type: "join",
            from: this.peerId,
        });
    }

    private async connectSignaling(): Promise<void> {
        if (!this.transferId) {
            throw new Error(
                "Transfer ID has not been set"
            );
        }

        this.signaling = new SignalingClient(
            this.transferId
        );

        this.signaling.onMessage(
            (message) => {
                void this.handleSignal(message);
            }
        );

        await this.signaling.connect();
    }

    private async handleSignal(message: SignalMessage): Promise<void> {
        if (message.to && message.to !== this.peerId) {
            return;
        }

        if (message.from === this.peerId) {
            return;
        }

        try {
            switch (message.type) {
                case "join":
                    await this.handleJoin(message);
                    break;
                case "offer":
                    await this.handleOffer(message);
                    break;
                case "answer":
                    await this.handleAnswer(message);
                    break;
                case "ice-candidate":
                    await this.handleIceCandidate(message);
                    break;
                case "leave":
                    await this.handleLeave(message);
                    break;
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private async handleJoin(message: SignalMessage): Promise<void> {
        if (this.role !== "sender") {
            return;
        }

        const remotePeerId = message.from;

        if (this.peers.has(remotePeerId)) {
            return;
        }

        const peer = this.createPeer(
            remotePeerId,
            true
        );

        await peer.createOffer();
    }

    private async handleOffer(message: SignalMessage): Promise<void> {
        if (this.role !== "receiver") {
            return;
        }

        const remotePeerId = message.from;

        if (!message.offer) {
            return;
        }

        let peer = this.peers.get(remotePeerId);

        if (!peer) {
            peer = this.createPeer(
                remotePeerId,
                false
            );
        }

        await peer.handleOffer(message.offer);
    }

    private async handleAnswer(message: SignalMessage): Promise<void> {
        if (this.role !== "sender") {
            return;
        }

        const peer = this.peers.get(message.from);

        if (!peer || !message.answer) {
            return;
        }

        await peer.handleAnswer(message.answer);
    }

    private async handleIceCandidate(message: SignalMessage): Promise<void> {
        const peer = this.peers.get(message.from);

        if (!peer || !message.candidate) {
            return;
        }

        await peer.handleIceCandidate(message.candidate);
    }

    private handleLeave(message: SignalMessage): void {
        const peer = this.peers.get(message.from);

        if (!peer) {
            return;
        }

        peer.close();

        this.peers.delete(message.from);
        this.connectedPeers.delete(message.from);

        this.callbacks.onPeerDisconnected?.(message.from, this.connectedPeers.size);

        if (this.connectedPeers.size === 0) {
            this.setStatus("connecting");
        }
    }

    private createPeer(remotePeerId: string, initiator: boolean): InstantPeer {
        const peer = new InstantPeer(
            this.peerId,
            remotePeerId,
            initiator,
            {
                onSignal: (message) => {
                    void this.signaling?.send(message);
                },
                onConnected: () => {
                    this.connectedPeers.add(remotePeerId);

                    this.callbacks.onPeerConnected?.(remotePeerId, this.connectedPeers.size);

                    this.setStatus("connected");
                },
                onDisconnected: () => {
                    this.connectedPeers.delete(remotePeerId);

                    this.callbacks.onPeerDisconnected?.(remotePeerId, this.connectedPeers.size);

                    if (this.connectedPeers.size === 0) {
                        this.setStatus("connecting");
                    }
                },
                onData: (data) => {
                    console.log("Instant data received", data);
                },
            },
        );

        this.peers.set(remotePeerId, peer);

        return peer;
    }

    private setStatus(status: InstantSessionStatus): void {
        this.status = status;

        this.callbacks.onStatusChange?.(status);
    }

    private handleError(error: unknown): void {
        const normailzedError = 
            error instanceof Error
                ? error
                : new Error(String(error));

        console.error("[InstantSession]", normailzedError);

        this.setStatus("error");

        this.callbacks.onError?.(normailzedError);
    }

    async destroy(): Promise<void> {
        for (const peer of this.peers.values()) {
            peer.close();
        }

        this.peers.clear();
        this.connectedPeers.clear();

        await this.signaling?.disconnect();

        this.signaling = null;
        this.transferId = null;

        this.setStatus("idle");
    }

    get id(): string | null {
        return this.transferId;
    }

    get peerCount(): number {
        return this.peers.size;
    }

    get connectedPeerCount(): number {
        return this.connectedPeers.size;
    }

    get connectionStatus(): InstantSessionStatus {
        return this.status;
    }
}
