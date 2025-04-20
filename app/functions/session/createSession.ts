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

    const { error: sessionCreationError } = await supabase.from('sessions').insert([
        { id: sessionId, password: hashedPassword, status: 'Active' }
    ]);

    if (sessionCreationError) return { status: 'error', message: 'Unable to Create Session' }

    const { data, error: participantCreationError} = await supabase.from('session_participants').insert([
        { display_name: displayName, session_id: sessionId, is_connected: true }
    ]).select();

    if (participantCreationError) return { status: 'error', message: 'Unable to Join Session' }

    const cookieStore = await cookies();
    cookieStore.set(`sessionAccess:${sessionId}`, 'true', {
        httpOnly: true,
        maxAge: 3600, // expires in 1 hour
        path: '/',
        secure: process.env.NODE_ENV === 'production', // only secure on HTTPS in prod
        sameSite: 'lax', // good for CSRF protection without breaking UX
    });

    cookieStore.set(`participant-${sessionId}`, data[0].id, {
        httpOnly: true,
        maxAge: 3600, // expires in 1 hour
        path: '/',
        secure: process.env.NODE_ENV === 'production', // only secure on HTTPS in prod
        sameSite: 'lax', // good for CSRF protection without breaking UX
    });

    return { status: 'success', message: 'Created a Session!' };
}