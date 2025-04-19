import { createClient } from "../utils/supabase/client";

async function decryptFile(encryptedBuffer: ArrayBuffer, userKey: string) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(userKey),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // Extract salt, IV, and encrypted data
    const salt = new Uint8Array(encryptedBuffer.slice(0, 16));
    const iv = new Uint8Array(encryptedBuffer.slice(16, 28));
    const encryptedData = encryptedBuffer.slice(28);

    const decryptionKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    try {
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            decryptionKey,
            encryptedData
        );

        // Extract file name (first 200 bytes) and MIME type (next 100 bytes)
        const fileNameBuffer = new Uint8Array(decryptedData.slice(0, 200));
        const fileTypeBuffer = new Uint8Array(decryptedData.slice(200, 300));
        const fileName = new TextDecoder().decode(fileNameBuffer).trim();
        const fileType = new TextDecoder().decode(fileTypeBuffer).trim();

        // Extract the actual file content
        const fileContent = decryptedData.slice(300);

        return { blob: new Blob([fileContent], { type: fileType }), fileName };

    } catch (error) {
        return;
    }
}

async function decryptText(encryptedBuffer: ArrayBuffer, userKey: string) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(userKey),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const salt = new Uint8Array(encryptedBuffer.slice(0, 16));
    const iv = new Uint8Array(encryptedBuffer.slice(16, 28));
    const encryptedData = encryptedBuffer.slice(28);

    const decryptionKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    try {
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            decryptionKey,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        return "Wrong Secret Key!";
    }
}

export async function downloadDecryptedFile(fileId: string, userKey: string) {
    const supabase = await createClient();

    let filePath = `encrypted-files/${fileId}.enc`;

    let { data, error } = await supabase.storage.from("encrypted-data").download(`${filePath}?nocache=${Date.now()}`);
    // ?nocache=${Date.now()} helps preventing querying cached files from Supabase CDN

    if (!error && data) {
        console.log(`File downloaded successfully, size: ${data.size} bytes`);

        const encryptedBuffer = await data.arrayBuffer();
        const decryptResult = await decryptFile(encryptedBuffer, userKey);

        if (!decryptResult) {
            return "Wrong Secret Key!";
        }

        const { blob, fileName } = decryptResult;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName; // Use original file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return "Success!";
    }

    filePath = `encrypted-files/${fileId}.txt`;

    ({ data, error } = await supabase.storage.from("encrypted-data").download(`${filePath}?nocache=${Date.now()}`));
     // ?nocache=${Date.now()} helps preventing querying cached files from Supabase CDN

    if (!error && data) {
        console.log(`Text file found: ${filePath}`);
        const encryptedBuffer = await data.arrayBuffer();
        return await decryptText(encryptedBuffer, userKey);
    }

    return "Unable to Locate File/Text";
}
