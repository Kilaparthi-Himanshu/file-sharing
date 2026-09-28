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
import { TransferReceiver } from "./TransferReceiver";

import {
    FileCancelMessage,
    encodeControlMessage,
    createTransferEndMessage
} from "./protocol/TransferProtocol";

import { getIceServers } from "./IceConfig";

export class InstantSession {
    private static readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000;

    private static readonly CONNECTION_TIMEOUT_MS = 30 * 1000;

    private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

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
    private readonly transferManagers = new Map<
        string,
        TransferManager
    >();

    private status: InstantSessionStatus = "idle";

    private readonly transferReceiver: TransferReceiver;

    private iceServers: RTCIceServer[] | null = null;

    private readonly forceRelay: boolean;

    /**
     * Session lifecycle.
     */
    private destroyed = false;

    /**
     * Inactivity cleanup.
     *
     * Activity is refreshed when:
     * - signaling messages are received
     * - a peer connects
     * - WebRTC data is received
     * - sender transfer progress occurs
     */
    private idleTimeout: ReturnType<typeof setTimeout> | null = null;

    private lastActivityAt = Date.now();

    constructor(
        role: InstantRole,
        private readonly callbacks: InstantSessionCallbacks = {},
        options?: {
            forceRelay?: boolean;
        }
    ) {
        this.role = role;
        this.peerId = generatePeerId();

        this.transferReceiver = new TransferReceiver({
            onFileStart: (receptionId, file) => {
                this.touchActivity();

                this.callbacks.onFileStart?.(
                    receptionId,
                    file
                );
            },
            onProgress: (
                receptionId,
                fileId,
                bytesReceived,
                totalBytes,
                progress
            ) => {
                this.touchActivity();

                this.callbacks.onReceiverProgress?.(
                    receptionId,
                    fileId,
                    bytesReceived,
                    totalBytes,
                    progress
                );
            },
            onAck: (fileId, bytes) => {
                for (const peer of this.peers.values()) {
                    if (peer.state !== "connected") {
                        continue;
                    }

                    peer.send(
                        encodeControlMessage({
                            type: "file-ack",
                            fileId,
                            bytes,
                        })
                    );
                }
            },
            onComplete: (file) => {
                this.touchActivity();

                this.callbacks.onFileCompleted?.(file);
                this.callbacks.onFileReceived?.(file);
            },
            onTransferComplete: () => {
                this.touchActivity();

                this.callbacks.onTransferCompleted?.();
            },
            onAbort: (files) => {
                for (const file of files) {
                    this.callbacks.onReceptionAborted?.(
                        file.receptionId,
                        file.fileId
                    );
                }
            },
            onCancel: (receptionId, fileId) => {
                this.touchActivity();

                this.sendFileCancel(fileId);

                this.callbacks.onReceptionCancelled?.(
                    receptionId,
                    fileId
                );
            },
            onError: (error) => {
                this.handleError(error);
            },
        });

        this.forceRelay = options?.forceRelay ?? false;

        this.scheduleIdleTimeout();
    }

    async create(files: File[]): Promise<string> {
        if (this.role !== "sender") {
            throw new Error(
                "Only a sender can create an Instant session"
            );
        }

        if (files.length === 0) {
            throw new Error(
                "A transfer must contain at least one file"
            );
        }

        if (this.transferId) {
            return this.transferId;
        }

        this.touchActivity();

        this.transferId = generateTransferId();

        /**
         * Create the logical transfer.
         *
         * The transfer ID is the same ID that receivers
         * will enter.
         */
        this.transfer = new Transfer(
            files,
            this.transferId
        );

        await this.connectSignaling();

        // Advertise that this transfer currently has an active sender.
        await this.signaling!.trackSender(this.peerId);

        this.setStatus("connecting");

        this.callbacks.onSessionCreated?.(
            this.transferId
        );

        return this.transferId;
    }

    private scheduleConnectionTimeout(): void {
        if (this.destroyed) return;

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        this.connectionTimeout =
            setTimeout(
                () => {
                    if (this.destroyed) return;

                    if (this.connectedPeers.size > 0) return;

                    console.warn(
                        "[InstantSession] Connection timeout:",
                        this.transferId
                    );

                    this.handleError(
                        new Error("Unable to establish the connection. Please try again.")
                    );

                    void this.destroy();
                },
                InstantSession.CONNECTION_TIMEOUT_MS
            );
    }

    async join(transferId: string): Promise<void> {
        if (this.role !== "receiver") {
            throw new Error(
                "Only a receiver can join an Instant session"
            );
        }

        if (!transferId) {
            throw new Error("Transfer ID is required");
        }

        this.transferId = transferId
            .trim()
            .toUpperCase();

        this.touchActivity();

        try {
            await this.connectSignaling();

            await this.signaling!.waitForPresenceSync();

            if (!this.signaling!.hasSender()) {
                throw new Error(
                    "No active transfer found for this ID"
                );
            }

            this.setStatus("connecting");

            await this.signaling!.send({
                type: "join",
                from: this.peerId,
            });

            this.scheduleConnectionTimeout();
        } catch (error) {
            await this.destroy();

            throw error instanceof Error
                ? error
                : new Error(String(error));
        }
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

    private async handleSignal(
        message: SignalMessage
    ): Promise<void> {
        if (this.destroyed) {
            return;
        }

        if (
            message.to &&
            message.to !== this.peerId
        ) {
            return;
        }

        if (message.from === this.peerId) {
            return;
        }

        this.touchActivity();

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

    private async handleJoin(
        message: SignalMessage
    ): Promise<void> {
        if (
            this.role !== "sender" ||
            this.destroyed
        ) {
            return;
        }

        const remotePeerId = message.from;

        if (this.peers.has(remotePeerId)) {
            return;
        }

        const peer = await this.createPeer(
            remotePeerId,
            true
        );

        await peer.createOffer();
    }

    private async handleOffer(
        message: SignalMessage
    ): Promise<void> {
        if (
            this.role !== "receiver" ||
            this.destroyed
        ) {
            return;
        }

        const remotePeerId = message.from;

        if (!message.offer) {
            return;
        }

        let peer = this.peers.get(
            remotePeerId
        );

        if (!peer) {
            peer = await this.createPeer(
                remotePeerId,
                false
            );
        }

        await peer.handleOffer(
            message.offer
        );
    }

    private async handleAnswer(
        message: SignalMessage
    ): Promise<void> {
        if (
            this.role !== "sender" ||
            this.destroyed
        ) {
            return;
        }

        const peer = this.peers.get(
            message.from
        );

        if (
            !peer ||
            !message.answer
        ) {
            return;
        }

        await peer.handleAnswer(
            message.answer
        );
    }

    private async handleIceCandidate(
        message: SignalMessage
    ): Promise<void> {
        if (this.destroyed) {
            return;
        }

        const peer = this.peers.get(
            message.from
        );

        if (
            !peer ||
            !message.candidate
        ) {
            return;
        }

        await peer.handleIceCandidate(
            message.candidate
        );
    }

    private async handleLeave(
        message: SignalMessage
    ): Promise<void> {
        const peer = this.peers.get(
            message.from
        );

        if (!peer) {
            return;
        }

        peer.close();

        this.peers.delete(
            message.from
        );

        this.connectedPeers.delete(
            message.from
        );

        this.transferManagers.delete(
            message.from
        );

        this.callbacks.onPeerDisconnected?.(
            message.from,
            this.connectedPeers.size
        );

        if (this.connectedPeers.size === 0) {
            this.setStatus("connecting");
        }
    }

    private async ensureIceServers(): Promise<RTCIceServer[]> {
        if (this.iceServers) {
            return this.iceServers;
        }

        this.iceServers =
            await getIceServers();

        console.log(
            "[InstantSession] ICE servers configured:",
            this.iceServers.map(
                (server) => ({
                    urls: server.urls,
                    hasCredentials:
                        !!server.username,
                })
            )
        );

        return this.iceServers;
    }

    private async createPeer(
        remotePeerId: string,
        initiator: boolean
    ): Promise<InstantPeer> {
        const iceServers =
            await this.ensureIceServers();

        const peer = new InstantPeer(
            this.peerId,
            remotePeerId,
            initiator,
            {
                onSignal: (message) => {
                    void this.signaling?.send(
                        message
                    );
                },

                onConnected: () => {
                    this.touchActivity();

                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout);
                        this.connectionTimeout = null;
                    }

                    this.connectedPeers.add(
                        remotePeerId
                    );

                    this.callbacks.onPeerConnected?.(
                        remotePeerId,
                        this.connectedPeers.size
                    );

                    this.setStatus("connected");

                    void this.handlePeerConnected(
                        remotePeerId,
                        peer
                    );
                },

                onDisconnected: () => {
                    this.connectedPeers.delete(
                        remotePeerId
                    );

                    this.transferManagers.delete(
                        remotePeerId
                    );

                    if (
                        this.role === "receiver" &&
                        this.connectedPeers.size === 0
                    ) {
                        this.transferReceiver.abort();
                    }

                    this.callbacks.onPeerDisconnected?.(
                        remotePeerId,
                        this.connectedPeers.size
                    );

                    if (
                        this.connectedPeers.size === 0
                    ) {
                        this.setStatus(
                            "connecting"
                        );
                    }
                },

                onData: (data) => {
                    if (this.destroyed) {
                        return;
                    }

                    this.touchActivity();

                    if (
                        this.role === "receiver"
                    ) {
                        void this.transferReceiver.handleData(
                            data
                        );

                        return;
                    }

                    if (
                        typeof data !== "string"
                    ) {
                        return;
                    }

                    try {
                        const message =
                            JSON.parse(data);

                        if (
                            message.type === "file-cancel"
                        ) {
                            this.handleFileCancel(
                                remotePeerId,
                                message as FileCancelMessage
                            );
                        }

                        if (
                            message.type === "file-ack"
                        ) {
                            this.transferManagers
                                .get(remotePeerId)
                                ?.handleAck(
                                    message.fileId,
                                    message.bytes
                                );

                            return;
                        }
                    } catch (error) {
                        this.handleError(
                            error
                        );
                    }
                },
            },
            {
                iceServers,
                iceTransportPolicy:
                    this.forceRelay
                        ? "relay"
                        : "all",
            }
        );

        this.peers.set(
            remotePeerId,
            peer
        );

        return peer;
    }

    /**
     * Called once a WebRTC DataChannel is ready.
     */
    private async handlePeerConnected(
        remotePeerId: string,
        peer: InstantPeer
    ): Promise<void> {
        if (this.role !== "sender") {
            return;
        }

        await this.startSendingToPeer(
            remotePeerId,
            peer
        );
    }

    private handleFileCancel(
        remotePeerId: string,
        message: FileCancelMessage
    ): void {
        if (this.role !== "sender") {
            return;
        }

        const manager =
            this.transferManagers.get(
                remotePeerId
            );

        if (!manager) {
            return;
        }

        manager.cancelFile(
            message.fileId
        );
    }

    cancelReception(
        receptionId: string
    ): void {
        if (this.role !== "receiver") {
            return;
        }

        this.transferReceiver.cancelFile(
            receptionId
        );

        this.touchActivity();
    }

    private sendFileCancel(
        fileId: string
    ): void {
        if (this.role !== "receiver") {
            return;
        }

        for (
            const peer of this.peers.values()
        ) {
            if (
                peer.state !== "connected"
            ) {
                continue;
            }

            peer.send(
                encodeControlMessage({
                    type: "file-cancel",
                    fileId,
                })
            );
        }
    }

    /**
     * Start sending the complete logical transfer
     * to one specific receiver.
     */
    private async startSendingToPeer(
        remotePeerId: string,
        peer: InstantPeer
    ): Promise<void> {
        if (!this.transfer) {
            this.handleError(
                new Error(
                    "Cannot send: transfer does not exist"
                )
            );

            return;
        }

        /**
         * Don't create another manager if this peer
         * has already started receiving this transfer.
         */
        if (
            this.transferManagers.has(
                remotePeerId
            )
        ) {
            return;
        }

        const manager =
            new TransferManager(
                peer,
                {
                    onProgress: (
                        progress
                    ) => {
                        this.touchActivity();

                        this.callbacks.onSendProgress?.(
                            remotePeerId,
                            progress
                        );
                    },

                    onComplete: (
                        fileId
                    ) => {
                        this.touchActivity();

                        this.callbacks.onFileSent?.(
                            remotePeerId,
                            fileId
                        );
                    },

                    onError: (
                        error
                    ) => {
                        this.handleError(
                            error
                        );
                    },
                }
            );

        this.transferManagers.set(
            remotePeerId,
            manager
        );

        try {
            /**
             * Send every file sequentially on this
             * particular peer.
             */
            for (
                const transferFile
                of this.transfer.transferFiles
            ) {
                await manager.sendFile(
                    transferFile.id,
                    transferFile.file
                );
            }

            /*
             * All files have been sent.
             *
             * DataChannel is ordered, so this message will
             * arrive after the final file-end message.
             */
            peer.send(
                encodeControlMessage(createTransferEndMessage())
            );

            console.log(
                "[InstantSession] TRANSFER COMPLETE:",
                this.transfer.id
            );
        } catch (error) {
            this.handleError(
                error
            );
        }
    }

    private setStatus(
        status: InstantSessionStatus
    ): void {
        if (this.destroyed) {
            return;
        }

        this.status = status;

        this.callbacks.onStatusChange?.(
            status
        );
    }

    private handleError(
        error: unknown
    ): void {
        if (this.destroyed) {
            return;
        }

        const normalizedError =
            error instanceof Error
                ? error
                : new Error(String(error));

        console.error(
            "[InstantSession]",
            normalizedError
        );

        this.setStatus("error");

        this.callbacks.onError?.(
            normalizedError
        );
    }

    /**
     * Refresh session activity and restart
     * the inactivity cleanup timer.
     */
    private touchActivity(): void {
        if (this.destroyed) {
            return;
        }

        this.lastActivityAt =
            Date.now();

        this.scheduleIdleTimeout();
    }

    private scheduleIdleTimeout(): void {
        if (this.destroyed) {
            return;
        }

        if (this.idleTimeout) {
            clearTimeout(
                this.idleTimeout
            );
        }

        this.idleTimeout =
            setTimeout(
                () => {
                    if (this.destroyed) {
                        return;
                    }

                    const inactiveFor =
                        Date.now() -
                        this.lastActivityAt;

                    if (
                        inactiveFor >=
                        InstantSession.IDLE_TIMEOUT_MS
                    ) {
                        console.log(
                            "[InstantSession] Idle timeout:",
                            this.transferId
                        );

                        void this.destroy();
                        return;
                    }

                    this.scheduleIdleTimeout();
                },
                InstantSession.IDLE_TIMEOUT_MS
            );
    }

    async destroy(): Promise<void> {
        if (this.destroyed) {
            return;
        }

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        const destroyedTransferId = this.transferId;

        this.destroyed = true;

        if (this.idleTimeout) {
            clearTimeout(
                this.idleTimeout
            );

            this.idleTimeout = null;
        }

        if (this.signaling) {
            try {
                await this.signaling.send({
                    type: "leave",
                    from: this.peerId,
                });
            } catch {
                // Signaling may already be disconnected.
            }
        }

        for (
            const peer of this.peers.values()
        ) {
            peer.close();
        }

        this.peers.clear();

        this.connectedPeers.clear();

        this.transferManagers.clear();

        this.transferReceiver.abort();

        this.transfer = null;

        await this.signaling?.disconnect();

        this.signaling = null;

        this.transferId = null;

        this.status = "idle";

        if (destroyedTransferId) {
            this.callbacks.onSessionDestroyed?.(destroyedTransferId);
        }
    }

    clearReceivedFiles(): void {
        this.transferReceiver.reset();
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

    get debugReceiverMemory(): {
        activeFiles: number;
        activeChunks: number;
        activeBytes: number;
    } {
        return this.transferReceiver.debugMemory;
    }
}
