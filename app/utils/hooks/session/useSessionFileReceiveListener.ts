'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { notifySuccess } from "@/app/components/Alerts";

export function useSessionFileReceiveListener(sessionId: string, participantId: string,  handleFileReceive: (file_path: string) => void) {
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const channel = supabase.channel('retrive-files')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'session_files',
            }, payload => {
                const file_path = payload.new.file_path;
                const fileParticipantId = payload.new.uploaded_by;
                if (fileParticipantId !== participantId) handleFileReceive(file_path);
            })
            .subscribe();

        return () => { channel.unsubscribe() };
    }, [sessionId]);
}
