import { SignalMessage } from "./types";

type PeerCallbacks = {
    onSignal: (message: SignalMessage) => void;
    onConnected: () => void;
    onDisconnected: () => void;
    onData: (data: MessageEvent["data"]) => void;
};

type IceCandidateStats = RTCStats & {
    candidateType?: RTCIceCandidateType;
    protocol?: string;
    address?: string;
    port?: number;
    relayProtocol?: string;
};

type InstantPeerOptions = {
    iceServers: RTCIceServer[],
    iceTransportPolicy?: RTCIceTransportPolicy,
};

export class InstantLane {
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
        private readonly lane: number,
        private readonly callbacks: PeerCallbacks,
        options: InstantPeerOptions,
    ) {
        this.connection = new RTCPeerConnection({
            iceServers: options.iceServers,
            iceTransportPolicy: options.iceTransportPolicy ?? "all",
        });

        this.setupConnection();

        if (this.initiator) {
            this.createDataChannel();
        }
    }

    private setupConnection(): void {
        this.connection.onicecandidate = (event) => {
            if (!event.candidate) return;

            // console.log(
            //     "[InstantPeer] Sending ICE candidate:",
            //     this.localPeerId,
            //     "→",
            //     this.remotePeerId
            // );

            this.callbacks.onSignal({
                type: "ice-candidate",
                from: this.localPeerId,
                to: this.remotePeerId,
                lane: this.lane,
                candidate: event.candidate.toJSON(),
            });
        }

        this.connection.onconnectionstatechange = () => {
            console.log(
                "[InstantPeer] Connection state:",
                this.localPeerId,
                "→",
                this.remotePeerId,
                this.connection.connectionState
            );

            const state = this.connection.connectionState;

            if (state === "failed" || state === "closed") {
                this.notifyDisconnected();
            }
        }

        this.connection.oniceconnectionstatechange = () => {
            const state = this.connection.iceConnectionState;

            console.log(
                "[InstantPeer] ICE state:",
                this.localPeerId,
                "→",
                this.remotePeerId,
                this.connection.iceConnectionState
            );

            if (state === "connected" || state === "completed") {
                void this.logSelectedCandidatePair(true);
            }
        }

        this.connection.onicecandidateerror = (event) => {
            console.warn(
                "[InstantPeer] ICE candidate error:",
                event.errorCode,
                event.errorText,
                event.url
            );
        }

        this.connection.ondatachannel = (event) => {
            this.setupDataChannel(event.channel);
        }

        this.connection.onicegatheringstatechange = () => {
            // console.log(
            //     "[InstantPeer] ICE GATHERING:",
            //     this.localPeerId,
            //     "→",
            //     this.remotePeerId,
            //     this.connection.iceGatheringState
            // );
        }
    }

    private createDataChannel(): void {
        const channel = this.connection.createDataChannel(
            `blinkshare-${this.lane}`,
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
            // console.log(
            //     "[InstantPeer] DATA CHANNEL OPEN:",
            //     this.localPeerId,
            //     "→",
            //     this.remotePeerId
            // );

            // console.log("[InstantPeer] SCTP CONFIG:", {
            //     localPeerId: this.localPeerId,
            //     remotePeerId: this.remotePeerId,
            //     maxMessageSize: this.connection.sctp?.maxMessageSize,
            //     dataChannelState: this.dataChannel?.readyState,
            //     negotiated: this.dataChannel?.negotiated,
            //     ordered: this.dataChannel?.ordered,
            // });

            this.notifyConnected();
        }

        channel.onclose = () => {
            // console.log(
            //     "[InstantPeer] DATA CHANNEL CLOSED:",
            //     this.localPeerId,
            //     "→",
            //     this.remotePeerId
            // );

            this.notifyDisconnected();
        }

        channel.onmessage = (event) => {
            this.callbacks.onData(event.data);
        }
    }

    async createOffer(): Promise<void> {
        // console.log(
        //     "[InstantPeer] CREATING OFFER:",
        //     this.localPeerId,
        //     "→",
        //     this.remotePeerId
        // );

        const offer = await this.connection.createOffer();

        await this.connection.setLocalDescription(offer);

        // console.log(
        //     "[InstantPeer] OFFER READY:",
        //     this.localPeerId,
        //     "→",
        //     this.remotePeerId
        // );

        this.callbacks.onSignal({
            type: "offer",
            from: this.localPeerId,
            to: this.remotePeerId,
            lane: this.lane,
            offer,
        });
    }

    async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        // console.log(
        //     "[InstantPeer] OFFER RECEIVED:",
        //     this.localPeerId,
        //     "←",
        //     this.remotePeerId
        // );

        await this.connection.setRemoteDescription(offer);

        // TEMPORARY DIAGNOSTIC
        // console.log("[InstantPeer] MESSAGE SIZE SDP:", {
        //     local: this.connection.localDescription?.sdp
        //         ?.split("\r\n")
        //         .filter((line) => line.includes("max-message-size")),
        //     remote: this.connection.remoteDescription?.sdp
        //         ?.split("\r\n")
        //         .filter((line) => line.includes("max-message-size")),
        // });

        // console.log(
        //     "[InstantPeer] REMOTE OFFER SET:",
        //     this.localPeerId,
        //     "←",
        //     this.remotePeerId
        // );

        this.remoteDescriptionSet = true;

        await this.flushPendingCandidates();

        const answer = await this.connection.createAnswer();

        await this.connection.setLocalDescription(answer);

        // console.log(
        //     "[InstantPeer] ANSWER READY:",
        //     this.localPeerId,
        //     "→",
        //     this.remotePeerId
        // );

        this.callbacks.onSignal({
            type: "answer",
            from: this.localPeerId,
            to: this.remotePeerId,
            lane: this.lane,
            answer,
        });
    }

    async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        // console.log(
        //     "[InstantPeer] ANSWER RECEIVED:",
        //     this.localPeerId,
        //     "←",
        //     this.remotePeerId
        // );

        await this.connection.setRemoteDescription(answer);

        // TEMPORARY DIAGNOSTIC
        // console.log("[InstantPeer] MESSAGE SIZE SDP:", {
        //     local: this.connection.localDescription?.sdp
        //         ?.split("\r\n")
        //         .filter((line) => line.includes("max-message-size")),
        //     remote: this.connection.remoteDescription?.sdp
        //         ?.split("\r\n")
        //         .filter((line) => line.includes("max-message-size")),
        // });

        // console.log(
        //     "[InstantPeer] REMOTE ANSWER SET:",
        //     this.localPeerId,
        //     "←",
        //     this.remotePeerId
        // );

        this.remoteDescriptionSet = true;

        await this.flushPendingCandidates();
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        // console.log(
        //     "[InstantPeer] Received ICE candidate:",
        //     this.localPeerId,
        //     "←",
        //     this.remotePeerId,
        //     candidate
        // );

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

        this.dataChannel.send(data);
    }

    setBufferedAmountLowThreshold(threshold: number): void {
        if (!this.dataChannel) {
            throw new Error("Data Channel does not exist");
        }

        this.dataChannel.bufferedAmountLowThreshold = threshold;
    }

    waitForBufferedAmountLow(): Promise<void> {
        if (!this.dataChannel) {
            throw new Error("Data Channel does not exist");
        }

        const channel = this.dataChannel;
        const threshold = channel.bufferedAmountLowThreshold;

        if (channel.readyState !== "open") {
            throw new Error("Data Channel is not open");
        }

        if (channel.bufferedAmount <= threshold) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            const cleanup = () => {
                channel.removeEventListener(
                    "bufferedamountlow",
                    handleBufferedAmountLow
                );

                channel.removeEventListener(
                    "close",
                    handleClose
                );

                channel.removeEventListener(
                    "error",
                    handleError
                );
            }

            const handleBufferedAmountLow = () => {
                if (channel.bufferedAmount <= threshold) {
                    cleanup();
                    resolve();
                }
            }

            const handleClose = () => {
                cleanup();
                reject(
                    new Error(
                        "Data Channel closed while waiting for buffer"
                    )
                );
            }

            const handleError = () => {
                cleanup();
                reject(
                    new Error(
                        "Data Channel error while waiting for buffer"
                    )
                );
            }

            channel.addEventListener(
                "bufferedamountlow",
                handleBufferedAmountLow
            );

            channel.addEventListener(
                "close",
                handleClose
            );

            channel.addEventListener(
                "error",
                handleError
            );

            // Re-check after listeners are attached
            if (channel.readyState !== "open") {
                handleClose();
                return;
            }

            if (channel.bufferedAmount <= threshold) {
                handleBufferedAmountLow();
            }
        });
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

    get maxMessageSize(): number | null {
        return this.connection.sctp?.maxMessageSize ?? null
    }

    public async logSelectedCandidatePair(logPath = true): Promise<void> {
        type IceCandidatePairStats = RTCIceCandidatePairStats & {
            packetsLost?: number;
        };

        try {
            const stats = await this.connection.getStats();

            let selectedPair: IceCandidatePairStats | null = null;

            for (const report of stats.values()) {
                if (
                    report.type === "candidate-pair" &&
                    report.state === "succeeded" &&
                    report.nominated
                ) {
                    selectedPair = report as IceCandidatePairStats;
                    break;
                }
            }

            if (!selectedPair) return;

            const local = stats.get(
                selectedPair.localCandidateId
            ) as IceCandidateStats | undefined;

            const remote = stats.get(
                selectedPair.remoteCandidateId
            ) as IceCandidateStats | undefined;

            // if (logPath) {
            //     console.log(
            //         "[InstantPeer] SELECTED ICE PATH:",
            //         {
            //             localType: local?.candidateType,
            //             remoteType: remote?.candidateType,
            //             protocol: local?.protocol,
            //             relayProtocol: local?.relayProtocol,
            //         }
            //     );
            // }

            // console.log(
            //     "[InstantPeer] ICE TRANSPORT STATS:",
            //     JSON.stringify({
            //         availableOutgoingMbps:
            //             selectedPair.availableOutgoingBitrate
            //                 ? (
            //                     selectedPair.availableOutgoingBitrate / 1_000_000
            //                 ).toFixed(2)
            //                 : undefined,

            //         availableIncomingMbps:
            //             selectedPair.availableIncomingBitrate
            //                 ? (
            //                     selectedPair.availableIncomingBitrate / 1_000_000
            //                 ).toFixed(2)
            //                 : undefined,

            //         currentRTT: selectedPair.currentRoundTripTime,

            //         packetsSent: selectedPair.packetsSent,
            //         packetsReceived: selectedPair.packetsReceived,
            //         packetsLost: selectedPair.packetsLost,

            //         bytesSent: selectedPair.bytesSent,
            //         bytesReceived: selectedPair.bytesReceived,

            //         // ICE connectivity / consent
            //         requestsSent: selectedPair.requestsSent,
            //         responsesReceived: selectedPair.responsesReceived,
            //         consentRequestsSent: selectedPair.consentRequestsSent,

            //         // Selected ICE path
            //         localCandidateType: local?.candidateType,
            //         localProtocol: local?.protocol,
            //         localRelayProtocol: local?.relayProtocol,

            //         remoteCandidateType: remote?.candidateType,
            //         remoteProtocol: remote?.protocol,
            //         remoteRelayProtocol: remote?.relayProtocol,
            //     })
            // );
        } catch (error) {
            console.warn(
                "[InstantPeer] Failed to inspect ICE stats:",
                error
            );
        }
    }

    public async logDataChannelStats(): Promise<void> {
        try {
            const stats = await this.connection.getStats();

            let dataChannelStats: RTCStats | undefined;
            let sctpTransportStats: RTCStats | undefined;

            for (const report of stats.values()) {
                if (report.type === "data-channel") {
                    dataChannelStats = report;
                }

                if (report.type === "sctp-transport") {
                    sctpTransportStats = report;
                }
            }

            // console.log(
            //     "[InstantPeer] DATACHANNEL STATS:",
            //     JSON.stringify({
            //         bufferedAmount: this.dataChannel?.bufferedAmount,
            //         dataChannel: dataChannelStats,
            //     })
            // );

            // console.log(
            //     "[InstantPeer] SCTP STATS:",
            //     sctpTransportStats
            // );

            // for (const report of stats.values()) {
            //     if (report.type === "data-channel") {
            //         console.log("[InstantPeer] DATACHANNEL RAW STATS:", JSON.stringify({
            //             state: report.state,
            //             messagesSent: report.messagesSent,
            //             bytesSent: report.bytesSent,
            //             messagesReceived: report.messagesReceived,
            //             bytesReceived: report.bytesReceived,
            //             bufferedAmount: this.dataChannel?.bufferedAmount,
            //         }));
            //     }
            // }
        } catch (error) {
            console.warn(
                "[InstantPeer] Failed to inspect DataChannel/SCTP stats:",
                error
            );
        }
    }
}

export const DEFAULT_LANE_COUNT = 2;

export class InstantPeer {
    private readonly lanes: Array<InstantLane | undefined> = [];
    private readonly openLanes = new Set<number>();

    private connectedNotified = false;
    private disconnectedNotified = false;

    constructor(
        private readonly localPeerId: string,
        private readonly remotePeerId: string,
        private readonly initiator: boolean,
        private readonly callbacks: PeerCallbacks,
        private readonly options: InstantPeerOptions,
        private readonly expectedLaneCount: number = DEFAULT_LANE_COUNT,
    ) {
        if (
            !Number.isInteger(expectedLaneCount) ||
            expectedLaneCount < 1
        ) {
            throw new Error("Lane count must be a positive integer");
        }

        // The sender creates all lanes. The receiver creates each lane
        // when the corresponding offer arrives.
        if (this.initiator) {
            for (let lane = 0; lane < expectedLaneCount; lane++) {
                this.getLane(lane);
            }
        }
    }

    private getLane(lane: number): InstantLane {
        if (
            !Number.isInteger(lane) ||
            lane < 0 ||
            lane >= this.expectedLaneCount
        ) {
            throw new Error(`Invalid lane index: ${lane}`);
        }

        // console.log("[BlinkShare] Lane created", {
        //     remotePeerId: this.remotePeerId,
        //     lane,
        // });

        const exisitng = this.lanes[lane];

        if (exisitng) {
            return exisitng;
        }

        const created = new InstantLane(
            this.localPeerId,
            this.remotePeerId,
            this.initiator,
            lane,
            {
                onSignal: (message) => {
                    this.callbacks.onSignal({
                        ...message,
                        lane,
                    });
                },

                onConnected: () => {
                    // console.log("[BlinkShare] Lane connected", {
                    //     remotePeerId: this.remotePeerId,
                    //     lane,
                    //     openLanes: [...this.openLanes],
                    //     expectedLaneCount: this.expectedLaneCount,
                    // });

                    this.openLanes.add(lane);

                    // Sender is ready only when every configured lane
                    // is open. Receiver readiness is based on lane 0.
                    const ready = this.initiator
                        ? this.openLanes.size === this.expectedLaneCount
                        : this.openLanes.has(0);

                    if (ready) {
                        this.notifyConnected();
                    }
                },

                onDisconnected: () => {
                    // console.log("[BlinkShare] Lane disconnected", {
                    //     remotePeerId: this.remotePeerId,
                    //     lane,
                    // });

                    this.openLanes.delete(lane);

                    // Lane 0 carries the control channel. If it fails,
                    // the logical connection cannot remain usable.
                    // For the sender, all configured lanes are required
                    // in this initial phase.
                    const connectionLost = this.initiator || lane === 0;

                    if (connectionLost) {
                        this.notifyDisconnected();
                    }
                },

                onData: (data) => {
                    this.callbacks.onData(data);
                },
            },
            this.options,
        );

        this.lanes[lane] = created;

        return created;
    }

    async createOffer(): Promise<void> {
        // Every lane produces its own offer and its own ICE candidates.
        await Promise.all(
            Array.from(
                { length: this.expectedLaneCount },
                (_, lane) => this.getLane(lane).createOffer(),
            ),
        );
    }

    async handleOffer(
        lane: number,
        offer: RTCSessionDescriptionInit,
    ): Promise<void> {
        await this.getLane(lane).handleOffer(offer);
    }

    async handleAnswer(
        lane: number,
        answer: RTCSessionDescriptionInit,
    ): Promise<void> {
        await this.getLane(lane).handleAnswer(answer);
    }

    async handleIceCandidate(
        lane: number,
        candidate: RTCIceCandidateInit,
    ) {
        await this.getLane(lane).handleIceCandidate(candidate);
    }

    // Phase 1: existing control messages and file data stay on lane 0.
    send(data: string | ArrayBuffer | Blob): void {
        this.getLane(0).send(data);
    }

    setBufferedAmountLowThreshold(threshold: number): void {
        this.getLane(0).setBufferedAmountLowThreshold(threshold);
    }

    waitForBufferedAmountLow(): Promise<void> {
        return this.getLane(0).waitForBufferedAmountLow();
    }

    get state(): RTCPeerConnectionState {
        // Preserve the existing API used by InstantSession and
        // TransferManager. Readiness notifications use the lane policy above.
        return this.getLane(0).state;
    }

    get bufferedAmount(): number {
        return this.getLane(0).bufferedAmount;
    }

    get maxMessageSize(): number | null {
        return this.getLane(0).maxMessageSize;
    }

    logSelectedCandidatePair(logPath = true): Promise<void> {
        return this.getLane(0).logSelectedCandidatePair(logPath);
    }

    logDataChannelStats(): Promise<void> {
        return this.getLane(0).logDataChannelStats();
    }

    get laneCount(): number {
        return this.lanes.filter(Boolean).length;
    }

    close(): void {
        for (const lane of this.lanes) {
            lane?.close();
        }

        this.openLanes.clear();
    }

    private notifyConnected(): void {
        if (this.connectedNotified) {
            return;
        }

        this.connectedNotified = true;
        this.disconnectedNotified = false;
        this.callbacks.onConnected();
    }

    private notifyDisconnected(): void {
        if (this.disconnectedNotified) {
            return;
        }

        this.disconnectedNotified = true;
        this.connectedNotified = false;
        this.callbacks.onDisconnected();
    }
}
