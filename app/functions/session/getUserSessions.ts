'use server';

import { cookies } from "next/headers";
import { createClient } from "@/app/utils/supabase/server";

export async function getUserSessions() {
    const cookieStore = await cookies();
    const supabase = await createClient();

    const allCookies = cookieStore.getAll();

    const sessions: { sessionId: string, participantId: string }[] = [];

    for (const cookie of allCookies) {
        if (cookie.name.startsWith('sessionAccess:')) {
            const sessionId = cookie.name.slice('sessionAccess:'.length); 
            // slices at 14 character remaining is id (after: it slices)
            const participantCookie = cookieStore.get(`participant-${sessionId}`);

            if (participantCookie) {
                sessions.push({
                    sessionId,
                    participantId: participantCookie.value
                });
            }
        }
    }

    if (sessions.length === 0) return [];

    const { data, error } = await supabase
        .from('session_participants')
        .select('session_id, display_name')
        .in('id', sessions.map(p => p.participantId))

    if (error) {
        console.log(error);
        return []
    };

    return data;
}
