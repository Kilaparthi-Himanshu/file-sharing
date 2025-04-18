'use client';

import React, { useState } from 'react';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import { AnimatePresence } from 'framer-motion';

export default function RoomOptions()  {
    const [modalType, setModalType] = useState<'create' | 'join' | null>(null);

    return (
        <div className='w-[100dvw] h-[100dvh] bg-black flex flex-col items-center justify-center text-white font-bold text-8xl gap-4'>
            <div onClick={() => setModalType('create')}>
                Create Room
            </div>
            <div onClick={() => setModalType('join')}>
                Join Room
            </div>

            <AnimatePresence>
                {modalType === 'create' && (
                    <CreateRoomModal removeModal={() => setModalType(null)} />
                )}
                {modalType === 'join' && (
                    <JoinRoomModal removeModal={() => setModalType(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
