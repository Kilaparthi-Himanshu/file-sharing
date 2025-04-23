'use server';

import { createClient } from "../../utils/supabase/server";
import bycrypt from "bcrypt";
import { cookies } from 'next/headers';

interface CreateSessionTypes {
    displayName: string;
    sessionId: string;
    password: string;
}

export default async function joinSession({ displayName, sessionId, password } : CreateSessionTypes) {
    const supabase = await createClient();
    const { data: hashedPasswordData, error: hashedPasswordDataError } = await supabase
        .from('sessions')
        .select('password')
        .eq('id', sessionId )
        .single();

    if (hashedPasswordDataError)  return { status: 'error', message: 'Unable to Retrive Password' }

    const isMatch = await bycrypt.compare(password, hashedPasswordData.password);

    if (!isMatch)  return { status: 'error', message: 'Wrong Password!' }
 
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