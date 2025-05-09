'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import CreateSessionModal from '../components/session/CreateSessionModal';
import JoinSessionModal from '../components/session/JoinSessionModal';
import { ToastContainer } from 'react-toastify';
import { MySessionsModal } from '../components/session/MySessionsModal';

export default function SessionOptions()  {
    const [modalType, setModalType] = useState<'create' | 'join' | 'mySessions' | null>(null);

    return (
        <>
            <div className='w-[100dvw] h-[100dvh] bg-black flex flex-col items-center justify-center text-white font-bold text-8xl gap-8 noise-texture'>
                <div onClick={() => setModalType('create')} className='bg-black hover:bg-neutral-800 transition-[background,scale] active:scale-98 border border-neutral-600 w-200 max-w-[96dvw] text-center rounded-lg flex items-center justify-center h-max py-20 pb-22 max-lg:py-15 max-lg:text-5xl max-lg:w-150 pointer-coarse:active:bg-neutral-800 animate-fade animate-once animate-ease-out'>
                    <span>Create Session</span>
                </div>

                <div onClick={() => setModalType('join')} className='bg-black hover:bg-neutral-800 transition-[background,scale] active:scale-98 border border-neutral-600 w-200 max-w-[96dvw] text-center rounded-lg flex flex-col items-center justify-center h-max py-20 pb-22 max-lg:py-15 max-lg:text-5xl max-lg:w-150 pointer-coarse:active:bg-neutral-800 animate-fade animate-once animate-ease-out'>
                    <span>Join Session</span>
                </div>

                <AnimatePresence>
                    {modalType === 'create' && (
                        <CreateSessionModal removeModal={() => setModalType(null)} />
                    )}
                    {modalType === 'join' && (
                        <JoinSessionModal removeModal={() => setModalType(null)} />
                    )}
                    {modalType === 'mySessions' && (
                        <MySessionsModal removeModal={() => setModalType(null)} setModalType={setModalType} />
                    )}
                </AnimatePresence>

                <div onClick={() => setModalType('mySessions')} className='absolute top-4 left-4 bg-black hover:bg-neutral-800 border border-neutral-600 text-2xl p-2 px-4 rounded-lg font-normal transition-[background,scale] active:scale-98 pointer-coarse:active:bg-neutral-800 animate-fade animate-once animate-ease-out'>
                    My Sessions
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
