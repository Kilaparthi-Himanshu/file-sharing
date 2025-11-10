import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsageCount, getUserProfile, parseExpiry, preflightCheck, validateApiKey, validateUrl, withCORS } from "@/app/api/utils";
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

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get("x-blink-key");
        const env = req.headers.get("x-blink-env") ?? "production";

        if (!apiKey) {
            return withCORS(NextResponse.json({ error: "Missing API key" }, { status: 401 }));
        }

        const userId = await validateApiKey(apiKey, supabaseAdmin);

        const form = await req.formData();
        const file = form.get("file") as File | null;
        const expiresIn = (form.get("expiresIn") as string) ?? "10m";
        const maxClicks = Number(form.get("maxClicks")) || 1;

        if (!file) {
            return withCORS(NextResponse.json({ error: "Missing encrypted file" }, { status: 400 }));
        }

        const profile = await getUserProfile(userId, supabaseAdmin);
        const quota = getQuota(profile?.plan || "free");
        const usage = await getUsageCount(userId, supabaseAdmin);
        if ((usage?.usage_count ?? 0) >= quota) {
            return withCORS(
                NextResponse.json({ error: "Daily quota exceeded — upgrade plan" }, { status: 429 })
            );
        } // If usage is null (first time using api on a day) defaults to 0.

        const durationMs = parseExpiry(expiresIn);
        const expiresAt = new Date(Date.now() + durationMs);
        const shortId = Math.random().toString(36).substring(2, 10);

        // Upload encrypted blob to Supabase storage
        const { data: upload, error: uploadError } = await supabaseAdmin
            .storage
            .from("encrypted-data")
            .upload(`encrypted-files/${shortId}.bin`, file, {
                contentType: "application/octet-stream",
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Public signed URL (valid until file expiry)
        const { data: signed } = await supabaseAdmin
            .storage
            .from("encrypted-data")
            .createSignedUrl(upload.path, durationMs / 1000);

        // Store in Supabase
        const { error: insertError } = await supabaseAdmin
            .from('links')
            .insert([{
                user_id: userId,
                api_key: apiKey,
                file_url: signed,
                short_id: shortId,
                expires_at: expiresAt.toISOString(),
                max_clicks: maxClicks
            }]);

        if (insertError) throw insertError;

        await supabaseAdmin.rpc("increment_daily_usage", { p_user_id: userId });

        const base =
            process.env.NODE_ENV === "development"
                ? "http://localhost:3000"
                : "https://blinkshare.vercel.app";

        const secureUrl = `${base}/api/link/${shortId}`;
        return withCORS(NextResponse.json({ url: secureUrl }));
    }   catch (err: any) {
        console.error("Error in createLink: ", err);
        return withCORS(NextResponse.json({ error: err.message }, { status: 400 }));
    }
}
