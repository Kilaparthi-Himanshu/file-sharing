'use server';

import { createClient } from "../../utils/supabase/server";
import bycrypt from "bcrypt";
import { cookies } from 'next/headers';

interface CreateSessionTypes {
    displayName: string;
    sessionId: string;
    password: string;
}

export default async function createSession({ displayName, sessionId, password } : CreateSessionTypes) {
    const supabase = await createClient();
    const hashedPassword = await bycrypt.hash(password, 10);

    const { error } = await supabase.from('sessions').insert([
        { id: sessionId, password: hashedPassword, status: 'Active' }
    ]);

    if (error) return { status: 'error', message: 'Unable to Create Session' };

    const cookieStore = await cookies();
    cookieStore.set(`sessionAccess:${sessionId}`, 'true', {
        httpOnly: true,
        maxAge: 3600, // expires in 1 hour
        path: '/',
        secure: process.env.NODE_ENV === 'production', // only secure on HTTPS in prod
        sameSite: 'lax', // good for CSRF protection without breaking UX
    });

    return { status: 'success', message: 'Created a Session!' };
}