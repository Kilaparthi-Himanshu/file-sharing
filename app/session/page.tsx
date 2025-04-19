'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import CreateSessionModal from '../components/session/CreateSessionModal';
import JoinSessionModal from '../components/session/JoinSessionModal';
import { ToastContainer } from 'react-toastify';

export default function SessionOptions()  {
    const [modalType, setModalType] = useState<'create' | 'join' | null>(null);

    return (
        <>
            <div className='w-[100dvw] h-[100dvh] bg-black flex flex-col items-center justify-center text-white font-bold text-8xl gap-4'>
                <div onClick={() => setModalType('create')}>
                    Create Session
                </div>
                <div onClick={() => setModalType('join')}>
                    Join Session
                </div>

                <AnimatePresence>
                    {modalType === 'create' && (
                        <CreateSessionModal removeModal={() => setModalType(null)} />
                    )}
                    {modalType === 'join' && (
                        <JoinSessionModal removeModal={() => setModalType(null)} />
                    )}
                </AnimatePresence>
            </div>
            <ToastContainer />
        </>
    );
}
