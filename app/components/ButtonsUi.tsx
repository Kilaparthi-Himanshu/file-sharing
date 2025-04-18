'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Squircle } from "@squircle-js/react";
import { SmoothCorners } from 'react-smooth-corners'
import SuperEllipse from "react-superellipse";

export const ButtonsUi = () => {
    const router = useRouter();

    const handleRedirect = (text: 'send' | 'receive' | 'room') => {
        router.push(`/${text}`);
    }

    const [isVisible, setIsVisible] = useState<boolean>(false);

    return (
        <div className='w-120 flex flex-col items-center max-sm:gap-8'>
            <div className='w-120 h-40 flex items-center justify-around font-mono max-sm:flex-col max-sm:h-auto gap-8'>
                <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("send")}>
                    Send
                </button>

                <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect("receive")}>
                    Receive
                </button>
            </div>

            <div className='relative'>
                <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98' onClick={() => handleRedirect('room')}>
                    Room
                </button>
            </div>
        </div>
    );
}