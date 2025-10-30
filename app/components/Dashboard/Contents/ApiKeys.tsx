'use client';

import React, { useState } from 'react';
import { CopyButton } from '../../CopyButton';
import { FaRegCopy } from "react-icons/fa";

export default function ApiKeys() {
    const [textisCopied, setTextIsCopied] = useState(false);

    const text = 'sdbfisdhfhsdfhisdhfdsfhsdfhsdihfisdhfpsdhfsdfhsdiuisdhfsahdfsdhfhasidhaishdahdiashdihasdhasdhashdosahdashdioahiod';

    const handleCopy = () => {
        setTextIsCopied(true);
        navigator.clipboard.writeText(text);
        setTimeout(() => {
            setTextIsCopied(false);
        }, 2000);
    }

    return (
        <div className='w-full h-full flex flex-col items-center p-10 gap-8'>
            <span className='text-4xl font-semibold text-white'>API Keys</span>

            <div className='bg-neutral-950 w-full h-max rounded-2xl flex flex-col'>
                <div className='flex flex-row w-full p-4 items-center justify-center'>
                    <span className='w-1/2 text-white text-md font-semibold'>BlinkShare API Key</span>
                    <div className='w-3/4 relative flex items-center gap-2'>
                        <div className='absolute right-2 h-full flex items-center justify-center w-[60px]'>
                            <div 
                                className='text-white bg-neutral-700 w-full h-[60%] flex items-center justify-center rounded-sm border border-neutral-500 transition-all active:scale-95 text-sm' 
                                onClick={() => {
                                    !textisCopied && handleCopy();
                                }}
                            >
                                {textisCopied ? 'Copied!' : <FaRegCopy size={18} />}
                            </div>
                        </div>

                        <input type="text" name='sessionId' className={`border-2 border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-neutral-400`} defaultValue={text} readOnly/>
                    </div>
                </div>
            </div>
        </div>
    );
}

