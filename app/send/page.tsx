'use client';

import React from 'react';
import { FileInput } from '../components/FileInput';
import { ModeSelect } from '../components/ModeSelect';
import { selectModeAtom } from '../Atoms/atoms';
import { useAtom } from 'jotai';
import { TextInput } from '../components/TextInput';

export default function Send() {
    const [mode, setMode] = useAtom(selectModeAtom);

    return (
        <div className='bg-black h-[100dvh] w-screen flex flex-col gap-15 items-center justify-center p-4 text-white overflow-hidden'>
           <div className='border border-neutral-500 w-120 h-auto rounded-xl flex flex-col items-center px-8 py-8 max-lg:w-80'>
                {mode === "File" ? <FileInput /> : <TextInput />}
            </div>
           <ModeSelect />
        </div>
    );
}
