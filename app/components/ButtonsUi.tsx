'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

export const ButtonsUi = () => {
    const router = useRouter();

    const handleRedirect = (text: string) => {
        router.push(`/${text}`);
    }

    return (
        <div className='w-120 h-40 flex gap-5 items-center justify-around font-mono'>
            <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("send")}>
                Send
            </button>
            <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("receive")}>
                Receive
            </button>
        </div>
    );
}
