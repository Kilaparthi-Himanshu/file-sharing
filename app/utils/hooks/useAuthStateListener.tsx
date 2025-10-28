import { userAtom } from "@/app/Atoms/atoms";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { supabase } from "../supabase/client";

export function useAuthStateListener() {
    const [, setUser] = useAtom(userAtom);

    useEffect(() => {
        // Listen to auth changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Initial Load
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [setUser]);
}
