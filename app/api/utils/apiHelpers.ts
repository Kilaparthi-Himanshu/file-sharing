// THESE FUNCTIONS MUST BE STRICTLY CALLED INSIDE **API ROUTES ONLY**

import { NextResponse } from "next/server";
import dns from "dns/promises";
import ip from "ip";
import { redis } from "@/app/utils/redis";
import { SupabaseClient } from "@supabase/supabase-js";

// UNIVERSAL CORS
export async function withCORS(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-blink-key, x-blink-env');
    return res;
}

// RATE LIMIT
export async function rateLimit(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const apiKey = req.headers.get("x-blink-key") || "no-key";
    const key = `ratelimit:${ip}-${apiKey}`;

    const now = Date.now();
    const windowMs = 5000; // 5s window

    // Check last request timestamp
    const last = await redis.get<number>(key);
    if (last && now - last < windowMs) {
        return false;
    }

    // Store current timestamp with TTL
    await redis.set(key, now, { ex: 5 });
    return true;
}

// SSRF GUARD
export async function validateUrl(fileUrl: string) {
    const u = new URL(fileUrl);

    // Must be http/https
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid protocol");

    // DNS resolve and block private ranges
    const addresses = await dns.lookup(u.hostname, { all: true });
    for (const { address } of addresses) {
        if (ip.isPrivate(address)) {
            throw new Error("Private IPs not allowed");
        }
    }
}

// HEAD PREFLIGHT
export async function preflightCheck(fileUrl: string) {
    const head = await fetch(fileUrl, { method: "HEAD" });
    if (!head.ok) throw new Error("File not reachable");

    const len = Number(head.headers.get("content-length"));
    if (len > 50 * 1024 * 1024) throw new Error("File too large (>50MB)");
}

// VALIDATE API KEY
export async function validateApiKey(apiKey: string, supabaseAdmin: SupabaseClient<any, "public", any>) {
    if (!apiKey.startsWith("blink_public_")) {
        throw new Error("Invalid Blink Api key");
    }

    const { data, error } = await supabaseAdmin
        .from("api_keys")
        .select("*")
        .eq("api_key", apiKey)
        .single();
    if (error || !data) {
        console.error("Supabase validation error:", error);
        throw new Error("Api key not found");
    }

    return data.user_id;
}

// PARSE EXPIRY DATE
export function parseExpiry(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 10 * 60 * 1000; // default 10m
    const [, num, unit] = match;
    const n = parseInt(num);
    switch (unit) {
        case "s": return n * 1000;
        case "m": return n * 60 * 1000;
        case "h": return n * 60 * 60 * 1000;
        case "d": return n * 24 * 60 * 60 * 1000;
        default: return 10 * 60 * 1000;
    }
}

// GET DEVELOPER PROFILE
export async function getUserProfile(userId: string, supabaseAdmin: SupabaseClient<any, "public", any>) {
    const { data: profile } = await supabaseAdmin
        .from("developer_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

    return profile;
}

// GET USAGE COUNT FOR THE DAY
export async function getUsageCount(userId: string, supabaseAdmin: SupabaseClient<any, "public", any>) {
    const today = new Date().toISOString().split("T")[0];

    const { data: usage, error } = await supabaseAdmin
        .from("api_usage")
        .select("usage_count")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

    if (error && error.code !== "PGRST116") throw error; // ignore 'no rows found'

    return usage;
}
