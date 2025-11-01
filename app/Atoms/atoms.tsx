import { User } from "@supabase/supabase-js";
import { atom } from "jotai";
import { DeveloperProfileType } from "@/types/supabase_database.types";

export const selectModeAtom = atom<"File" | "Folder" | "Text">("File");

export const sessionDetails = atom<{
    displayName: string | null;
    sessionId: string | null;
}>({
    displayName: null,
    sessionId: null
});

export const sessionPassword = atom<string | null>(null);

export const lifeTimeAtom = atom<number>(30);

export const userAtom = atom<User | null>(null);

export const profileAtom = atom<DeveloperProfileType | null>(null);
