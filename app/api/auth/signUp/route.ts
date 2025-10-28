import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEmailAndResend(email: string) {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const existingUser = users.users.find(u => u.email === email);

    if (!existingUser) {
        return { status: "new_user" };
    }

    if (!existingUser.email_confirmed_at) {
        await supabaseAdmin.auth.resend({
            type: "signup",
            email
        });
        return { status: "resent" };
    }

    return { status: "already_verified" };
}

export async function POST(req: NextRequest) {
    const { email, password, full_name, username } = await req.json();

    const { data: existingUser } = await supabaseAdmin
        .from("developer_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

    if (existingUser) {
        return NextResponse.json({
            status: 'error',
            message: 'Username already taken.'
        });
    }

    const result = await checkEmailAndResend(email);

    if (result.status === "resent") {
        return NextResponse.json({ 
            status: 'error', 
            message: "This email already exists. Verification email has been re-sent!" 
        });
    }

    if (result.status === "already_verified") {
        return NextResponse.json({ 
            status: 'error', 
            message: "Email already registered. Please sign in." 
        });
    }

    const { error } = await supabaseAdmin
        .auth
        .signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    username
                }
            }
        });
    if (error) {
        console.error(error);
        return NextResponse.json({ 
            status: 'error', 
            message: error.message 
        });
    }

    return NextResponse.json({ 
        status: 'success', 
        message: 'Verification mail has been sent!' 
    });
}
