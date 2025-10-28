'use client';

import { useAtom, useAtomValue } from "jotai";
import { useAuthStateListener } from "../utils/hooks/useAuthStateListener";
import { profileAtom, userAtom } from "../Atoms/atoms";
import { useDeveloperProfile } from "../utils/hooks/useDeveloperProfile";
import { useEffect } from "react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthStateListener();
    const user = useAtomValue(userAtom);
    const { data: profile, isLoading } = useDeveloperProfile(user?.id);
    const [, setProfile] = useAtom(profileAtom);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            return;
        }

        if (profile) setProfile(profile);
    }, [user, profile, setProfile]);

    return (
        <>
            {children}
        </>
    );
}
