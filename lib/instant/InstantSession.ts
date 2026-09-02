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

import { Transfer } from "./Transfer";
import { TransferManager } from "./TransferManager";
import { TransferReceiver, ReceivedFile } from "./TransferReceiver";

export class InstantSession {
    private readonly peerId: string;
    private readonly role: InstantRole;

    private transferId: string | null = null;

    private signaling: SignalingClient | null = null;

    private readonly peers = new Map<string, InstantPeer>();

    private readonly connectedPeers = new Set<string>();

    /**
     * Logical transfer.
     *
     * One Transfer represents all files selected for
     * this particular transfer ID.
     */
    private transfer: Transfer | null = null;

    /**
     * Sender:
     *
     * Every peer gets its own TransferManager because
     * every WebRTC DataChannel is an independent connection.
     */
    private readonly transferManagers = new Map<string,TransferManager>();

    /**
     * Receiver:
     *
     * Every peer gets its own TransferReceiver.
     */
    private readonly transferReceivers = new Map<string, TransferReceiver>();

    private status: InstantSessionStatus = "idle";

    constructor(
        role: InstantRole,
        private readonly callbacks: InstantSessionCallbacks = {}
    ) {
        this.role = role;
        this.peerId = generatePeerId();
    }

    async create(files: File[]): Promise<string> {
        if (this.role !== "sender") {
            throw new Error("Only a sender can create an Instant session");
        }

        if (files.length === 0) {
            throw new Error("A transfer must contain at least one file");
        }

        if (this.transferId) {
            return this.transferId;
        }

        this.transferId = generateTransferId();

        /**
         * Create the logical transfer.
         *
         * The transfer ID is the same ID that receivers
         * will enter.
        */
       this.transfer = new Transfer(files, this.transferId);

       await this.connectSignaling();

       this.setStatus("connecting");

       this.callbacks.onSessionCreated?.(this.transferId);

       return this.transferId;
    }

    async join(transferId: string): Promise<void> {
        if (this.role !== "receiver") {
            throw new Error("Only a receiver can join an Instant session");
        }

        if (!transferId) {
            throw new Error("Transfer ID is required");
        }

        this.transferId = transferId
            .trim()
            .toUpperCase();

        await this.connectSignaling();

        this.setStatus("connecting");

        await this.signaling!.send({
            type: "join",
            from: this.peerId,
        });
    }

    private async connectSignaling(): Promise<void> {
        if (!this.transferId) {
            throw new Error("Transfer ID has not been set");
        }

        this.signaling = new SignalingClient(this.transferId);

        this.signaling.onMessage(
            (message) => {
                void this.handleSignal(message)
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

        const peer = this.createPeer(remotePeerId, true);

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
            peer = this.createPeer(remotePeerId, false);
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

        this.transferManagers.delete(message.from);

        this.transferReceivers.delete(message.from);

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

                    void this.handlePeerConnected(remotePeerId, peer);
                },
                onDisconnected: () => {
                    this.connectedPeers.delete(remotePeerId);

                    this.transferManagers.delete(remotePeerId);

                    this.transferReceivers.delete(remotePeerId);

                    this.callbacks.onPeerDisconnected?.(remotePeerId, this.connectedPeers.size);

                    if (this.connectedPeers.size === 0) {
                        this.setStatus("connecting");
                    }
                },
                onData: (data) => {
                    void this.handlePeerData(remotePeerId, data);
                }
            }
        );

        this.peers.set(remotePeerId, peer);

        return peer;
    }

    /**
     * Called once a WebRTC DataChannel is ready.
     */
    private async handlePeerConnected(remotePeerId: string, peer: InstantPeer): Promise<void> {
        if (this.role === "sender") {
            await this.startSendingToPeer(remotePeerId, peer);

            return;
        }

        /**
         * Receiver gets a TransferReceiver for this peer.
         */
        if (!this.transferReceivers.has(remotePeerId)) {
            const receiver =
                new TransferReceiver({
                    onFileStart: (file) => {
                        this.callbacks.onFileStart?.(file);
                    },
                    onProgress: (
                        fileId,
                        bytesReceived,
                        totalBytes,
                        progress
                    ) => {
                        this.callbacks.onReceiverProgress?.(
                            fileId,
                            bytesReceived,
                            totalBytes,
                            progress
                        );
                    },
                    onComplete: (file) => {
                        this.callbacks.onFileCompleted?.(file);
                    },
                    onError: (error) => {
                        this.handleError(error);
                    },
                });

            this.transferReceivers.set(remotePeerId, receiver);
        }
    }

    /**
     * Start sending the complete logical transfer
     * to one specific receiver.
     */
    private async startSendingToPeer(remotePeerId: string, peer: InstantPeer): Promise<void> {
        if (!this.transfer) {
            this.handleError(
                new Error("Cannot send: transfer does not exist")
            );

            return;
        }

        /**
         * Don't create another manager if this peer
         * has already started receiving this transfer.
         */
        if (this.transferManagers.has(remotePeerId)) {
            return;
        }

        const manager = new TransferManager(
            peer,
            {
                onProgress: (progress) => {
                    this.callbacks.onSendProgress?.(
                        remotePeerId,
                        progress
                    );
                },
                onComplete: (fileId) => {
                    this.callbacks.onFileSent?.(
                        remotePeerId,
                        fileId
                    );
                },
                onError: (error) => {
                    this.handleError(error);
                },
            }
        );

        this.transferManagers.set(remotePeerId, manager);

        try {
            /**
             * Send every file sequentially on this
             * particular peer.
             */
            for (const transferFile of this.transfer.transferFiles) {
                await manager.sendFile(
                    transferFile.id,
                    transferFile.file,
                );
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Route incoming WebRTC data to the receiver.
     */
    private async handlePeerData(
        remotePeerId: string, 
        data: MessageEvent["data"]
    ): Promise<void> {
        if (this.role !== "receiver") {
            return;
        }

        const receiver = this.transferReceivers.get(remotePeerId);

        if (!receiver) {
            this.handleError(
                new Error("Received data before receiver was initialized")
            );
        }

        await receiver?.handleData(data);
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

        this.transferManagers.clear();

        this.transferReceivers.clear();

        this.transfer = null;

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
