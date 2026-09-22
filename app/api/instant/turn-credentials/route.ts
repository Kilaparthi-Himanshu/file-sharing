import { NextResponse } from "next/server";

const CLOUDFLARE_TURN_URL = "https://rtc.live.cloudflare.com/v1/turn/keys";

const TURN_TTL_SECONDS = 24 * 60 * 60;

export async function GET() {
    const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
    const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;

    if (!keyId || !apiToken) {
        console.error("[TURN] Cloudflare TURN environment variables are missing");

        return NextResponse.json(
            {
                error: "TURN service is not configured",
            },
            { status: 503 }
        );
    }

    try {
        const response = await fetch(
            `${CLOUDFLARE_TURN_URL}/${keyId}/credentials/generate-ice-servers`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ttl: TURN_TTL_SECONDS
                }),

                // Don't cache credentials
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const body = await response.text();

            console.error(
                "[TURN] Cloudflare credential generation failed:",
                response.status,
                body
            );

            return NextResponse.json(
                {
                    error: "Failed to generate TURN credentials",
                },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!Array.isArray(data.iceServers)) {
            console.error(
                "[TURN] Invalid Cloudflare response:",
                data
            );

            return NextResponse.json(
                {
                    error: "Invalid TURN configuration received",
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            {
                iceServers: data.iceServers,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        console.error(
            "[TURN] Failed to contact Cloudflare:",
            error
        );

        return NextResponse.json(
            {
                error: "TURN service unavailable",
            },
            { status: 502 }
        );
    }
}
