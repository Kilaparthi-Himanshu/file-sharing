'use client';

import { createClient } from "@/app/utils/supabase/client";
import { useEffect, useRef } from "react";

export default function UpdateLastActive({ sessionId }: { sessionId: string }) {
    const supabase = createClient();
    const lastUpdatedRef = useRef(0);

    useEffect(() => {
        const updateLastActive = async() => {
            const now = Date.now();
            const FIVE_MINUTES = 5 * 60 * 1000;

            if (now - lastUpdatedRef.current > FIVE_MINUTES) {
                await supabase
                    .from('sessions')
                    .update({ last_active: new Date().toISOString() })
                    .eq('id', sessionId);

                lastUpdatedRef.current = now;
            }
        }

        const handleActivity = () => {
            updateLastActive();
        }

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, [sessionId, supabase]);

    return null;
}
