import { supabase } from "./supabase/client";

export type SignUpDetailsTypes = {
    full_name: string;
    username: string;
    email: string;
    password: string;
}

export async function signUpUser({ full_name, username, email, password } : SignUpDetailsTypes) {
   const res = await fetch('/api/auth/signUp', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, username, email, password })
    });

    if (!res.ok) {
        throw new Error("Network Error");
    }

    return res.json();
}

export async function signInUser({ email, password }: Pick<SignUpDetailsTypes, "email" | "password">) {
    const { error } = await supabase
        .auth
        .signInWithPassword({
            email,
            password
        });

    if (error) {
        return { 
            status: 'error', 
            message: error.message 
        };
    }

    return { 
        status: 'success', 
        message: 'Signed In successfully!' 
    };
}

export async function resetPassword({ email }: Pick<SignUpDetailsTypes, "email">) {
    const { error } = await supabase
        .auth
        .resetPasswordForEmail(email, {
            redirectTo: `${window.location.href}/reset`
        });

    if (error) {
        return { 
            status: 'error', 
            message: error.message 
        };
    }

    return { 
        status: 'success', 
        message: 'Reset Link Sent Successfully!' 
    };
}

export async function updateUser({ password }: Pick<SignUpDetailsTypes, "password">) {
    const { error } = await supabase
        .auth
        .updateUser({
            password
        });

    if (error) {
        return { 
            status: 'error', 
            message: error.message 
        };
    }

    return { 
        status: 'success', 
        message: 'Password Updated Successfully!' 
    };
}
