import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/app/utils/supabase/client";
import { SignalMessage } from "./types";

type SignalHandler = (message: SignalMessage) => void;

type InstantPresence = {
    role: "sender";
    peerId: string;
}

export class SignalingClient {
    private channel: RealtimeChannel | null = null;
    private handler: SignalHandler | null = null;

    private presenceSyncPromise: Promise<void> | null = null;
    private resolvePresenceSync: (() => void) | null = null;

    constructor(
        private readonly transferId: string
    ) {}

    async connect(): Promise<void> {
        const supabase = await createClient();

        this.channel = supabase.channel(
            `instant:${this.transferId}`,
            {
                config: {
                    presence: {
                        enabled: true,
                        key: crypto.randomUUID(),
                    }
                }
            }
        );

        this.channel.on(
            "broadcast",
            { event: "signal" },
            (payload) => {
                const message = payload.payload as SignalMessage;

                this.handler?.(message);
            }
        );

        this.presenceSyncPromise = new Promise<void>((resolve) => this.resolvePresenceSync = resolve);

        this.channel.on(
            "presence",
            { event: "sync" },
            () => {
                console.log(
                    "[SignalingClient] Presence synced:",
                    this.channel?.presenceState<InstantPresence>()
                );

                this.resolvePresenceSync?.();
                this.resolvePresenceSync = null;
            }
        );

        await new Promise<void>((resolve, reject) => {
            this.channel!.subscribe((status, error) => {
                if (status === "SUBSCRIBED") {
                    resolve();
                    return;
                }

                if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    reject(
                        error ?? new Error(
                            `Unable to subscribe to signaling channel: ${status}`
                        )
                    );
                }
            });
        });
    }

    async waitForPresenceSync(): Promise<void> {
        if (!this.presenceSyncPromise) {
            throw new Error("Singaling channel is not connected");
        }

        await this.presenceSyncPromise;
    }

    async trackSender(peerId: string): Promise<void> {
        if (!this.channel) {
            throw new Error("Signaling channel is not connected");
        }

        const status = await this.channel.track({
            role: "sender",
            peerId
        });

        if (status !== "ok") {
            throw new Error(`Failed to track sender presence: ${status}`);
        }
    }

    hasSender(): boolean {
        if (!this.channel) {
            return false;
        }

        const state = this.channel.presenceState<InstantPresence>();

        for (const presences of Object.values(state)) {
            for (const presence of presences) {
                if (presence.role === "sender") {
                    return true;
                }
            }
        }

        return false;
    }

    onMessage(handler: SignalHandler): void {
        this.handler = handler;
    }

    async send(message: SignalMessage): Promise<void> {
        if (!this.channel) {
            throw new Error("Signaling channel is not connected");
        }

        const response = await this.channel.send({
            type: "broadcast",
            event: "signal",
            payload: message,
        });

        if (response !== "ok") {
            throw new Error(
                `Failed to send signaling message: ${response}`
            );
        }
    }

    async disconnect(): Promise<void> {
        if (!this.channel) {
            return;
        }

        await this.channel.unsubscribe();

        this.channel = null;
        this.handler = null;
    }
}
