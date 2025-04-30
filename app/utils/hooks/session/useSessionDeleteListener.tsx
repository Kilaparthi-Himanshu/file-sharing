'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { notifySuccess } from "@/app/components/Alerts";

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
                notifySuccess({
                    message: 'Deleted The Session !', 
                    onClose: () => router.push('/session'), 
                    time: 2000, 
                    hideProgressBar: false
                })
            })
            .subscribe();

        return () => { channel.unsubscribe(); }
    }, [sessionId, router]);
}
