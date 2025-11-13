import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withCORS } from "@/app/api/utils";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { autoRefreshToken: false, persistSession: false },
    }
);

export async function OPTIONS() {
    return withCORS(new NextResponse(null, { status: 204 }));
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: shortId } = await params;

    try {
        const { secretKey } = await req.json();
        if (!secretKey)
            return withCORS(NextResponse.json({ error: "Missing secret key" }, { status: 400 }));

        // Fetch link data
        const { data: link, error } = await supabaseAdmin
            .from("links")
            .select("*")
            .eq("short_id", shortId)
            .single();

        if (error || !link)
            return withCORS(NextResponse.json({ error: "Link not found" }, { status: 404 }));

        // Check expiry and activity status
        const now = new Date();
        const expiresAt = new Date(link.expires_at);
        const expired = expiresAt.getTime() <= now.getTime();
        const maxed = link.click_count >= link.max_clicks;

        if (expired || maxed || !link.is_active) {
            // mark as inactive once
            if (link.is_active) {
                await supabaseAdmin
                    .from("links")
                    .update({ is_active: false })
                    .eq("short_id", shortId)
            }

            return withCORS(NextResponse.json(
                { error: expired ? "Link expired" : "Max clicks reached" },
                { status: 410 } // HTTP 410 Gone
            ));
        }

        // Download ciphertext
        const upstream = await fetch(link.file_url, {
            method: "GET",
            headers: {
                // In future add custom headers either provided by user or for supabase bucket
            }
        });

        if (!upstream.ok) {
            return withCORS(NextResponse.json(
                { error: "Failed to fetch file from source" },
                { status: 502 }
            ));
        }

        const headers = new Headers();
        headers.set(
            "Content-Type",
            upstream.headers.get("content-type") || "application/octet-stream"
        );

        return withCORS(new NextResponse(upstream.body, { headers }));
    } catch (err) {
        console.error("Error serving link:", err);
        return withCORS(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
    }
}

async function decryptServerSide(encryptedBlob: Blob, userKey: string): Promise<Buffer> {
    const buffer = Buffer.from(await encryptedBlob.arrayBuffer());
    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 28);
    const ciphertext = buffer.subarray(28);

    const crypto = await import("crypto");
    const keyMaterial = crypto.pbkdf2Sync(userKey, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyMaterial, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
}

