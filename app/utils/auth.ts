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
        console.error(error);
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
