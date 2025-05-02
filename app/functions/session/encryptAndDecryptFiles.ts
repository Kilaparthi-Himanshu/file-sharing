import { SenderFiles } from "@/app/components/session/SendFiles";
import { createClient } from "@/app/utils/supabase/client";
import { encryptFile } from "../encrypt";
import { decryptFile } from "../decrypt";

export async function encryptFiles (files: SenderFiles[], password: string, sessionId: string, uploaded_by: string) {
    const supabase = createClient();

    const encryptedFiles: Blob[] = await Promise.all(
        files.map(file => encryptFile(file.file, password))
    );

    for (const blob of encryptedFiles) { // of give the blob itseld in give the index
        const fileId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const filePath = `encrypted-files/${sessionId}/${fileId}.enc`;

        const { data, error } = await supabase.storage.from('sessions-data').upload(filePath, blob, {
            contentType: "application/octet-stream"
        });

        if (error) {
            console.error(error);
            continue;
        }

        await supabase.from('session_files').insert([
            { 
                id: fileId, 
                session_id: sessionId, 
                uploaded_by, 
                uploaded_at: new Date().toISOString(), 
                file_path: data.path
            }
        ]);
    }
}

export type DecryptedFile = {
    blob: Blob;
    fileName: string;
}

export async function decryptFiles(blob: Blob, password: string) {

    const encryptedBuffer = await blob.arrayBuffer();
    const decryptedResult = await decryptFile(encryptedBuffer, password);

    if (!decryptedResult) return;

    console.log(decryptedResult);

    return decryptedResult;
}