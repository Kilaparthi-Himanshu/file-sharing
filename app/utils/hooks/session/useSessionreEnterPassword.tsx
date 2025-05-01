'use client';

import { sessionPassword } from "@/app/Atoms/atoms";
import { ReEnterPassword } from "@/app/components/session/ReEnterPassword";
import { useAtom } from "jotai";

export default function useSessionreEnterPassword(sessionId: string) {
    const [currentSessionPassword, setCurrentSessionPassword] = useAtom(sessionPassword);

    if (!currentSessionPassword) {
        return {
            isValid: false,
            fallback: <ReEnterPassword sessionId={sessionId} />,
            password: null
        }
    } else {
        return {
            isValid: true,
            fallback: null,
            password: currentSessionPassword
        }
    }
}