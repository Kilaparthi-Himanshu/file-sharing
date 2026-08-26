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

        // Remote Procedure Call which increases the click_count
        await supabaseAdmin.rpc("increment_link_clicks", { p_short_id: shortId });

        // Download ciphertext
        const { data: blob } = await supabaseAdmin
            .storage
            .from("encrypted-data")
            .download(link.file_path);

        if (!blob) return withCORS(NextResponse.json({ error: "File not found" }, { status: 404 }));

        // Decrypt
        const decrypted = await decryptServerSide(blob, secretKey);

        // Extract metadata
        const filename = new TextDecoder().decode(decrypted.subarray(0, 200)).trim();
        const mimeType = new TextDecoder().decode(decrypted.subarray(200, 300)).trim();
        const fileBytes = decrypted.subarray(300);

        // Create a stream (required for identical proxy behavior)
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(fileBytes));
                controller.close();
            }
        });

        // Return EXACTLY like createLink endpoint
        return withCORS(
            new NextResponse(stream, {
                headers: {
                    "Content-Type": mimeType || "application/octet-stream",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                }
            })
        );

    } catch (err) {
        console.error("Error serving link:", err);
        return withCORS(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
    }
}

async function decryptServerSide(encryptedBlob: Blob, userKey: string): Promise<Buffer> {
    const buffer = Buffer.from(await encryptedBlob.arrayBuffer());

    // --- Parse salt + iv
    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 28);

    // --- Remaining bytes = ciphertext + tag
    const encrypted = buffer.subarray(28);

    // AES-GCM tag is ALWAYS last 16 bytes
    const tag = encrypted.subarray(encrypted.length - 16);
    const ciphertext = encrypted.subarray(0, encrypted.length - 16);

    // --- Derive same key using PBKDF2
    const crypto = await import("crypto");
    const keyMaterial = crypto.pbkdf2Sync(
        userKey,
        salt,
        100000,
        32,       // 256-bit key
        "sha256"
    );

    // --- Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyMaterial, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);

    return decrypted;
}
