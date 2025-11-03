'use server';

import { createClient } from "@/app/utils/supabase/server";

export async function deleteApiKey(userId: string) {
    const supabase = await createClient();

     const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) return { status: 'error', message: error.message };

    if (!data) return { status: 'error', message: 'No API Key to delete.' };

    const { error: deleteApiKeyError } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userId);

    if (deleteApiKeyError) return { status: 'error', message: 'Unable to delete the API Key' };

    return { status: 'success', message: 'Successfully deleted the API Key' };
}
