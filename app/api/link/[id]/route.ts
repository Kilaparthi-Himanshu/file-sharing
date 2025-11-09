import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: shortId } = await params;

    try {
        // Fetch link data
        const { data: link, error } = await supabaseAdmin
            .from("links")
            .select("*")
            .eq("short_id", shortId)
            .single();

        if (error || !link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

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

            return NextResponse.json(
                { error: expired ? "Link expired" : "Max clicks reached" },
                { status: 410 } // HTTP 410 Gone
            );
        }

        // Remote Procedure Call which increases the click_count
        await supabaseAdmin.rpc("increment_link_clicks", { p_short_id: shortId });

        // Fetch the actual file and stream it
        const upstream = await fetch(link.file_url, {
            method: "GET",
            headers: {
                // In future add custom headers either provided by user or for supabase bucket
            }
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: "Failed to fetch file from source" },
                { status: 502 }
            );
        }

        const headers = new Headers();
        headers.set(
            "Content-Type",
            upstream.headers.get("content-type") || "application/octet-stream"
        );

        return new NextResponse(upstream.body, { headers });
    } catch (err) {
        console.error("Error serving link:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
