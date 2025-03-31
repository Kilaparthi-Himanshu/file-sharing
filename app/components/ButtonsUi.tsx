'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

export const ButtonsUi = () => {
    const router = useRouter();

    const handleRedirect = (text: 'send' | 'receive') => {
        router.push(`/${text}`);
    }

    return (
        <div className='w-120 max-lg:w-max max-lg:gap-4 h-40 flex items-center justify-around max-lg:justify-center font-mono'>
            <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("send")}>
                Send
            </button>

            <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("receive")}>
                Receive
            </button>
        </div>
    );
}
