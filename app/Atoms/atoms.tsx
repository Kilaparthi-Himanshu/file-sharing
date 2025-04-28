import { atom } from "jotai";

export const selectModeAtom = atom<"File" | "Folder" | "Text">("File");

export const sessionDetails = atom<{
    displayName: string | null;
    sessionId: string | null;
}>({
    displayName: null,
    sessionId: null
});

export const sessionPassword = atom<string | null>(null);