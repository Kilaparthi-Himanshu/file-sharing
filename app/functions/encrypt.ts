import { createClient } from "../utils/supabase/client";

async function encryptFile(file: File, userKey: string) {
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

    const fileBuffer = await file.arrayBuffer();

    // Convert file name, extension, and MIME type into fixed-length Uint8Array
    const fileNameEncoded = new TextEncoder().encode(file.name.padEnd(200, " "));
    const fileTypeEncoded = new TextEncoder().encode(file.type.padEnd(100, " "));

    // Combine metadata + file content
    const combinedBuffer = new Uint8Array(fileNameEncoded.length + fileTypeEncoded.length + fileBuffer.byteLength);
    combinedBuffer.set(fileNameEncoded, 0);
    combinedBuffer.set(fileTypeEncoded, fileNameEncoded.length);
    combinedBuffer.set(new Uint8Array(fileBuffer), fileNameEncoded.length + fileTypeEncoded.length);

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        encryptionKey,
        combinedBuffer
    );

    // Create final Blob with salt + IV + encrypted data
    return new Blob([salt, iv, encryptedData], { type: "application/octet-stream" });
}


export async function uploadEncryptedFile(file: File, userKey: string) {
    const supabase = await createClient();

    const encryptedBlob = await encryptFile(file, userKey);

    // const formData = new FormData();
    // formData.append("file", encryptedBlob);

    // const response = await fetch('/api/fileUpload', {
    //     method: "POST",
    //     body: formData
    // });

    // if (!response.ok)
    //     throw new Error("Upload Failed");

    // const { fileId } = await response.json();

    const fileId = Math.floor(100000 + Math.random() * 900000).toString();
    const filePath = `encrypted-files/${fileId}.enc`; // Store with `.enc` extension

    const {data, error } = await supabase.storage.from("encrypted-data").upload(filePath, encryptedBlob, {
        contentType: "application/octet-stream"
    });

    if (error) {
        throw new Error("Failed to upload file: " + error.message);
    }

    await supabase.from('temporary_files').insert([
        { file_path: data.path, uploaded_at: new Date().toISOString() }
    ]);

    return { fileId }; // Return file ID for later decryption
}
