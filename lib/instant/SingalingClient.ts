import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/app/utils/supabase/client";
import { SignalMessage } from "./types";

type SignalHandler = (message: SignalMessage) => void;

export class SignalingClient {
    private channel: RealtimeChannel | null = null;
    private handler: SignalHandler | null = null;

    constructor(
        private readonly transferId: string
    ) {}

    async connect(): Promise<void> {
        const supabase = await createClient();

        this.channel = supabase.channel(
            `instant:${this.transferId}`
        );

        this.channel.on(
            "broadcast",
            { event: "signal" },
            (payload) => {
                const message = payload.payload as SignalMessage;

                this.handler?.(message);
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
