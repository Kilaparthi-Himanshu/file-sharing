export async function getIceServers(): Promise<RTCIceServer[]> {
    const fallback: RTCIceServer[] = [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ];

    try {
        const response = await fetch(
            "/api/instant/turn-credentials",
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            console.warn(
                "[ICE] TURN credentials unavailable:",
                response.status
            );

            return fallback;
        }

        const data = await response.json();

        if (!Array.isArray(data.iceServers)) {
            console.warn(
                "[ICE] Invalid TURN configuration"
            );

            return fallback;
        }

        return [
            ...fallback,
            ...data.iceServers
        ];
    } catch (error) {
        console.warn(
            "[ICE] Could not obtain TURN credentials. " +
            "Continuing with STUN only.",
            error
        );

        return fallback;
    }
}
