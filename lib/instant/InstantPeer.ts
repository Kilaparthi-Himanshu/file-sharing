import { SignalMessage } from "./types";

type PeerCallbacks = {
    onSignal: (message: SignalMessage) => void;
    onConnected: () => void;
    onDisconnected: () => void;
    onData: (data: MessageEvent["data"]) => void;
};

export class InstantPeer {
    private readonly connection: RTCPeerConnection;
    private dataChannel: RTCDataChannel | null = null;

    private remoteDescriptionSet = false;
    private pendingCandidates: RTCIceCandidateInit[] = [];

    private connectedNotified = false;
    private disconnectedNotified = false;

    constructor(
        private readonly localPeerId: string,
        private readonly remotePeerId: string,
        private readonly initiator: boolean,
        private readonly callbacks: PeerCallbacks,
    ) {
        this.connection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                }
            ],
        });

        this.setupConnection();

        if (this.initiator) {
            this.createDataChannel();
        }
    }

    private setupConnection(): void {
        this.connection.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            this.callbacks.onSignal({
                type: "ice-candidate",
                from: this.localPeerId,
                to: this.remotePeerId,
                candidate: event.candidate.toJSON(),
            });
        }

        this.connection.onconnectionstatechange = () => {
            const state = this.connection.connectionState;

            if (
                state === "failed" ||
                state === "closed"
            ) {
                this.notifyDisconnected();
            }
        }

        this.connection.ondatachannel = (event) => {
            this.setupDataChannel(event.channel);
        }
    }

    private createDataChannel(): void {
        const channel = this.connection.createDataChannel(
            "blinkshare",
            {
                ordered: true
            }
        );

        this.setupDataChannel(channel);
    }

    private setupDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel;

        channel.binaryType = "arraybuffer";

        channel.onopen = () => {
            this.notifyConnected();
        }

        channel.onclose = () => {
            this.notifyDisconnected();
        }

        channel.onmessage = (event) => {
            this.callbacks.onData(event.data);
        }
    }

    async createOffer(): Promise<void> {
        const offer = await this.connection.createOffer();

        await this.connection.setLocalDescription(offer);

        this.callbacks.onSignal({
            type: "offer",
            from: this.localPeerId,
            to: this.remotePeerId,
            offer,
        });
    }

    async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        await this.connection.setRemoteDescription(offer);

        this.remoteDescriptionSet = true;

        await this.flushPendingCandidates();

        const answer = await this.connection.createAnswer();

        await this.connection.setLocalDescription(answer);

        this.callbacks.onSignal({
            type: "answer",
            from: this.localPeerId,
            to: this.remotePeerId,
            answer,
        });
    }

    async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        await this.connection.setRemoteDescription(answer);

        this.remoteDescriptionSet = true;

        await this.flushPendingCandidates();
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.remoteDescriptionSet) {
            this.pendingCandidates.push(candidate);

            return;
        }

        await this.connection.addIceCandidate(candidate);
    }

    private async flushPendingCandidates(): Promise<void> {
        if (!this.remoteDescriptionSet) {
            return;
        }

        for (const candidate of this.pendingCandidates) {
            await this.connection.addIceCandidate(candidate);
        }

        this.pendingCandidates = [];
    }

    send(data: string | ArrayBuffer | Blob): void {
        if (!this.dataChannel) {
            throw new Error("Data Channel does not exist");
        }

        if (this.dataChannel.readyState !== "open") {
            throw new Error("Data Channel is not open");
        }

        // this.dataChannel.send(data);

        if (typeof data === "string") {
            this.dataChannel.send(data);
            return;
        }

        if (data instanceof Blob) {
            this.dataChannel.send(data);
            return;
        }

        this.dataChannel.send(new Uint8Array(data));
    }

    close(): void {
        this.dataChannel?.close();
        this.connection.close();
    }

    private notifyConnected(): void {
        if (this.connectedNotified) {
            return;
        }

        this.connectedNotified = true;
        this.disconnectedNotified = false;

        this.callbacks.onConnected();
    }

    private notifyDisconnected() {
        if (this.disconnectedNotified) {
            return;
        }

        this.disconnectedNotified = true;
        this.connectedNotified = false;

        this.callbacks.onDisconnected();
    }

    get state(): RTCPeerConnectionState {
        return this.connection.connectionState;
    }

    get bufferedAmount(): number {
        return this.dataChannel?.bufferedAmount ?? 0;
    }
}
