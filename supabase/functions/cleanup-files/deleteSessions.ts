import { createClient } from 'https://esm.sh/@supabase/supabase-js';
 
const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function deleteSessions() {
    const fiftyEightMinutesAgo = new Date(Date.now() - 58 * 60 * 1000).toISOString();

    // Get sessions older than 58 minutes
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .lt('last_active', fiftyEightMinutesAgo);

    if (error) {
        console.error('Error fetching expired sessions:', error);
        return;
    }

    const ids = sessions.map(s => s.id);
    const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error('Error deleting expired sessions:', error);
        return;
    }

    console.log(`Deleted ${sessions.length} expired sessions.`);
}