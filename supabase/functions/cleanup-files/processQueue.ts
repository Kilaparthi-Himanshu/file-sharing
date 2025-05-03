import { createClient } from 'https://esm.sh/@supabase/supabase-js';
 
const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function processQueue() {
    const { data: queuedFiles, error } = await supabase
        .from('file_deletion_que')
        .select('*');

    if (error) {
        console.error('Error fetching from file_deletion_que:', error);
        return;
    }

    for (const file of queuedFiles) {
        await supabase.storage.from('sessions-data').remove([file.file_path]);

        await supabase
            .from('file_deletion_que')
            .delete()
            .eq('file_path', file.file_path);
    }

    console.log(`Processed ${queuedFiles.length} queued deletions.`);
}