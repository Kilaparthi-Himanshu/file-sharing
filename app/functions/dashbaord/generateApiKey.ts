'use server';

import { createClient } from "@/app/utils/supabase/server";
import { randomBytes } from "crypto";

export async function generateApiKey() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) return { status: 'error', message: 'Not Signed In' };

    const rawKey = randomBytes(32).toString('hex');
    const publicKey = `blink_public_${rawKey}`;

    const { error } = await supabase
        .from('api_keys')
        .insert([{ user_id: user.id, api_key: publicKey }]);

    if (error) return { status: 'error', message: error.message };

    return { status: 'success', api_key: publicKey };
}
