import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { processQueue } from './processQueue.ts';
import { deleteSessions } from './deleteSessions.ts';
 
const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function cleanupFiles() {
    const now = Date.now(); // e.g., 1714728000000ms

    const { data: files, error } = await supabase
        .from('temporary_files')
        .select('file_path, uploaded_at, expires_in');

    if (error) {
        console.error('Error fetching files:', error);
        return;
    }

    const expiredFiles = files.filter(file => {
        const uploadedTime = new Date(file.uploaded_at).getTime(); // converts timestamp into Date object and return ms
        const lifeTimeMs = file.expires_in * 60 * 1000;
        return now - uploadedTime > lifeTimeMs;
    });

    for (const file of expiredFiles) {
        // Delete from Supabase Storage
        await supabase.storage.from('encrypted-data').remove([file.file_path]);

        // Remove entry from the database
        await supabase.from('temporary_files').delete().eq('file_path', file.file_path);
    }

    console.log(`Deleted ${expiredFiles.length} expired files.`);
}

cleanupFiles();

processQueue();

deleteSessions();