'use server';

import Link from 'next/link';
import React from 'react';

export const ButtonsUi = async () => {

    return (
        <div className='w-120 flex flex-col items-center max-sm:gap-8'>
            <div className='w-120 h-40 flex items-center justify-around font-mono max-sm:flex-col max-sm:h-auto gap-8 motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-100'>
                <Link className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-center bg-black' href='/send'>
                    Send
                </Link>

                <Link className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-center bg-black' href='/receive'>
                    Receive
                </Link>
            </div>

            <div className='relative motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-100'>
                <Link className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-center bg-black font-mono' href='/session'>
                    Session
                </Link>
            </div>
        </div>
    );
}