import { atom } from "jotai";

export const selectModeAtom = atom<"File" | "Folder" | "Text">("File");