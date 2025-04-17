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
                <div 
                    onMouseEnter={() => setIsVisible(true)} 
                    onMouseLeave={() => setIsVisible(false)} 
                    onTouchStart={() => setIsVisible(true)}
                >
                    <button className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 disabled:bg-neutral-800 disabled:active:scale-100 opacity-70' onClick={() => handleRedirect('room')} disabled>
                        Room
                    </button>
                </div>

                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            className="absolute top-[90%] left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            style={{
                                willChange: 'opacity',
                                transform: 'translateZ(0)',
                            }}
                        >
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: 10 }}
                                exit={{ y: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                style={{
                                willChange: 'transform',
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden',
                                }}
                                className="text-white text-xl font-mono"
                            >
                                <SmoothCorners
                                    corners="12, 3"
                                    borderRadius="20px"
                                    className="bg-neutral-900 p-4 text-white"
                                    {...{} as any}
                                    >
                                    Upcoming!
                                </SmoothCorners>
                            </motion.div>
                        </motion.div>
                        )}
                    </AnimatePresence>
            </div>
        </div>
    );
}