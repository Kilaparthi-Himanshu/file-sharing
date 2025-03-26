import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (_req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Get files older than 5 minutes
    const { data: files, error } = await supabase
        .from('temporary_files')
        .select('*')
        .lt('uploaded_at', thirtyMinutesAgo);

    if (error) {
        console.error('Error fetching expired files:', error);
        return;
    }

    for (const file of files) {
        // Delete from Supabase Storage
        await supabase.storage.from('encrypted-data').remove([file.file_path]);

        // Remove entry from the database
        await supabase.from('temporary_files').delete().eq('file_path', file.file_path);
    }

    return new Response(
        JSON.stringify({ message: `Deleted ${files.length} expired files` }),
        { status: 200 }
    );
});
