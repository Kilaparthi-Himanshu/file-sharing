import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsageCount, getUserProfile, parseExpiry, preflightCheck, rateLimit, validateApiKey, validateUrl, withCORS } from "@/app/api/utils";
import { getQuota } from "@/app/functions/dashbaord/planQuota";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function OPTIONS() {
    return withCORS(new NextResponse(null, { status: 204 }));
}

// MAIN HANDLER
export async function POST(req: Request) {
    try {
        // // Rate limiting
        // if (!await rateLimit(req)) {
        //     return withCORS(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
        // }

        // Parse headers and body
        const apiKey = req.headers.get("x-blink-key");
        const env = req.headers.get("x-blink-env") ?? "production";
        const { fileUrl, expiresIn = "10m", maxClicks = 1 } = await req.json();

        if (!apiKey) {
            return withCORS(NextResponse.json({ error: "Missing API key" }, { status: 401 }));
        }

        if (!fileUrl) {
            return withCORS(NextResponse.json({ error: "Missing fileUrl" }, { status: 400 }));
        }

        // Validate API key
        const userId = await validateApiKey(apiKey, supabaseAdmin);

        // Check Quota
        const profile = await getUserProfile(userId, supabaseAdmin);
        const quota = getQuota(profile?.plan || "free");
        const usage = await getUsageCount(userId, supabaseAdmin);
        if ((usage?.usage_count ?? 0) >= quota) {
            return withCORS(
                NextResponse.json({ error: "Daily quota exceeded — upgrade plan" }, { status: 429 })
            );
        } // If usage is null (first time using api on a day) defaults to 0.

        // HTTPS enforcement logic
        if (env === "development" && fileUrl.startsWith("http://localhost")) {
            console.log("Dev mode detected — allowing local file URL");
        } else {
            await validateUrl(fileUrl);
        }

        // HEAD preflight
        await preflightCheck(fileUrl);

        // Parse expiresIn string like "10m", "1h", "1d"
        const durationMs = parseExpiry(expiresIn);
        const expiresAt = new Date(Date.now() + durationMs);

        const shortId = Math.random().toString(36).substring(2, 10);

        // Store in Supabase
        const { error } = await supabaseAdmin
            .from('links')
            .insert([{
                user_id: userId,
                api_key: apiKey,
                file_url: fileUrl,
                short_id: shortId,
                expires_at: expiresAt.toISOString(),
                max_clicks: maxClicks
            }]);

        if (error) throw error;

        // Remote Procedure Call which increases the usage_count
        await supabaseAdmin.rpc("increment_daily_usage", { p_user_id: userId });

        // Construct and return the secure link
        const base =
            process.env.NODE_ENV === "development"
                ? "http://localhost:3000"
                : "https://blinkshare.vercel.app";
        const secureUrl = `${base}/api/link/${shortId}`;
        return withCORS(NextResponse.json({ url: secureUrl }));
    } catch (err: any) {
        console.error("Error in createLink: ", err);
        return withCORS(NextResponse.json({ error: err.message }, { status: 400 }));
    }
}
