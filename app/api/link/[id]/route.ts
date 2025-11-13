import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { withCORS } from "../../utils";

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
            return withCORS(NextResponse.json({ error: "Link not found" }, { status: 404 }));
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

            return withCORS(NextResponse.json(
                { error: expired ? "Link expired" : "Max clicks reached" },
                { status: 410 } // HTTP 410 Gone
            ));
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
            return withCORS(NextResponse.json(
                { error: "Failed to fetch file from source" },
                { status: 502 }
            ));
        }

        const headers = new Headers();

        // Set Content-Type
        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        headers.set("Content-Type", contentType);

        // Set Content-Disposition a.k.a type and name of the file
        // For example, it looks like this: "Content-Disposition": `attachment; filename="BlinkShare.png"
        const contentDisp = upstream.headers.get("Content-Disposition");

        if (contentDisp) {
            // If it exists in upstream
            headers.set("Content-Disposition", contentDisp);
            console.log("CD: ", contentDisp);
        } else {
            // If it does not exist in upstream
            const urlObj = new URL(link.file_url);
            const last = urlObj.pathname.split("/").pop();

            // Fallback file name
            let filename = "download";

            if (last && last.includes(".")) {
                filename = last;
            } else {
                const ext = contentType.split("/")[1] || "bin";
                filename = `download.${ext}`;
            }

            headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        }

        return withCORS(new NextResponse(upstream.body, { headers }));
    } catch (err) {
        console.error("Error serving link:", err);
        return withCORS(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
    }
}
