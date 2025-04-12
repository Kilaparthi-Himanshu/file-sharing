import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const fileId = Math.floor(100000 + Math.random() * 900000).toString();
    const filePath = `encrypted-files/${fileId}.enc`; // Store with `.enc` extension

    const supabase = await createClient();
    const {data, error } = await supabase.storage.from("encrypted-data").upload(filePath, file, {
        contentType: "application/octet-stream"
    });

    if (error) {
        throw new Error("Failed to upload file: " + error.message);
    }

    await supabase.from('temporary_files').insert([
        { file_path: data.path, uploaded_at: new Date().toISOString() }
    ]);

    return NextResponse.json({ fileId });
}

// API to upload to supabase