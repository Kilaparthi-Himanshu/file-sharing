import { atom } from "jotai";

export const selectModeAtom = atom<"File" | "Folder" | "Text">("File");

export const sessionDetails = atom<{
    displayName: string;
    sessionId: string;
}>({
    displayName: "",
    sessionId: ""
});