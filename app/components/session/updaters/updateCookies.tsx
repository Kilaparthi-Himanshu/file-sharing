'use client';

import { useEffect } from "react";

export default function RefreshSessionCookies({ sessionId }: { sessionId: string }) {
    useEffect(() =>{ 
        const interval = setInterval(async () => {
            try {
                await fetch(`/session/${sessionId}`, { method: 'GET' });
            } catch(error) {
                console.error('Failed to refresh session cookies', error);
            }
        }, 40 * 60 * 1000); // 40 minutes

        return () => clearInterval(interval);
    }, [sessionId]);

    return null;
}