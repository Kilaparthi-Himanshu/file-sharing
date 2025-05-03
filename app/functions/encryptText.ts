import { createClient } from "../utils/supabase/client";

async function encryptText(text: string, userKey: string) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(userKey),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptionKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        encryptionKey,
        encoder.encode(text)
    );

    // Combine salt, IV, and encrypted text into a single Blob
    return new Blob([salt, iv, encryptedData], { type: "application/octet-stream" });
}

export async function uploadEncryptedText(text: string, userKey: string, lifeTime: number) {
    const supabase = createClient();
    const encryptedBlob = await encryptText(text, userKey);

    const fileId = Math.floor(100000 + Math.random() * 900000).toString();
    const filePath = `encrypted-files/${fileId}.txt`;

    const { data, error } = await supabase.storage.from("encrypted-data").upload(filePath, encryptedBlob, {
        contentType: "application/octet-stream"
    });

    if (error) {
        throw new Error("Failed to upload text: " + error.message);
    }

    await supabase.from('temporary_files').insert([
        { file_path: data.path, uploaded_at: new Date().toISOString(), expires_in: lifeTime }
    ]);

    return { fileId }; // Return the unique file ID for later retrieval
}
