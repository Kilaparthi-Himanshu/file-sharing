'use client'

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import RegenarateIcon from './RegenerateIcon';
import { useGenerateRandomName } from '@/app/utils/hooks/useGenerateRandomName';

export default function CreateRoomModal({removeModal} : {removeModal: () => void}) {
    const [roomId, setRoomId] = useState<string>("");
    const {randomName, RandomNameButton} = useGenerateRandomName();

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                removeModal();
            }
        }

        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, []);

    useEffect(() => {
        generateNewId();
    }, []);

    const generateNewId = () => {
        setRoomId(Math.floor(100000 + Math.random() * 900000).toString());
    }

    function printLol(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        console.log(formData.get('input'));
    }

    return (
        <motion.div
            className="w-[100dvw] h-[100dvh] fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={removeModal}
        >
            <motion.div 
                className="bg-black border border-neutral-600 p-8 text-xl w-[500px] h-max rounded-xl font-normal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} // prevent backdrop click
            >
                <form onSubmit={printLol} className='w-full h-full flex flex-col items-center justify-center gap-4'>
                    <div className='w-full flex flex-col gap-4'>
                        <label>Room ID:</label>
                        <div className='w-full relative'>
                            <input type="text" name='input' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-neutral-400`} maxLength={6} defaultValue={roomId} required readOnly/>
                            <RegenarateIcon generateNewId={generateNewId} />
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-4'>
                        <label>Room ID:</label>
                        <div className='w-full relative'>
                            <input type="text" name='input' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} maxLength={6} defaultValue={randomName} required/>
                            <RandomNameButton />
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-4'>
                        <label>Enter Room Password:</label>
                        <input type="text" name='input' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Room Password' required />
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}