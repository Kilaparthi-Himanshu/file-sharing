'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";

export function useSessionDeletionListener(sessionId: string) {
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const channel = supabase.channel('session-delete-listener')
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'sessions',
                filter: `id=eq.${sessionId}`
            }, _payload => {
                router.replace('/404');
            })
            .subscribe();

        return () => { channel.unsubscribe(); }
    }, [sessionId, router]);
}
