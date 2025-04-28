'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { getUserSessions } from '@/app/functions/session/getUserSessions';
import { useQuery } from '@tanstack/react-query';
import { SpinnerRenderer } from '../Spinner';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { sessionPassword } from '@/app/Atoms/atoms';
import { FaRegSadTear } from "react-icons/fa";

type MySessionsModalTypes = {
    removeModal: () => void;
    setModalType: React.Dispatch<React.SetStateAction<"join" | "create" | "mySessions" | null>>;
}

type sessionData = {
    session_id: string;
    display_name: string;
}

export const MySessionsModal = ({ removeModal, setModalType } : MySessionsModalTypes) => {

    const { data: sessions, error, isPending } = useQuery<sessionData[]>({
        queryKey: ['sessions'],
        queryFn: getUserSessions,
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        if (error) console.error(error);
    }, [error]);

    return (
            <>
            <motion.div
                className="w-[100dvw] h-[100dvh] fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={removeModal}
            >
                <motion.div 
                    className="bg-black border border-neutral-500 p-8 text-xl w-[500px] h-max rounded-xl font-normal relative flex flex-col items-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()} // prevent backdrop click
                >
                    <div className='mb-2 border-b'>My Sessions</div>
                    <IoClose className='absolute top-2 right-2 text-white' size={34} onClick={removeModal} />
                    <div className='w-full flex flex-col items-center h-120 p-2 overflow-y-auto custom-scrollbar gap-4'>
                         {isPending ? (
                            <SpinnerRenderer />
                        ) :
                            sessions && sessions.length > 0 ? (
                            sessions.map(session => (
                                <SessionBanner session={session} key={session.session_id}/>
                            ))
                        ) : (
                            <div className='h-full w-full flex flex-col items-center justify-center text-2xl font-bold'>
                                No Active Sessions
                                <FaRegSadTear size={70} className='mt-10' />
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}

const SessionBanner = ({ session }: { session: sessionData }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [currentSessionPassword, setCurrentSessionPassword] = useAtom(sessionPassword);
    const router = useRouter();
    const handleClick = () => {
        setCurrentSessionPassword('');
        router.push(`/session/${session.session_id}`);
    }

    return (
        <div 
            className='w-full border border-neutral-600 h-10 items-center p-2 rounded-lg flex justify-around relative active:scale-98 transition-[scale]' onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <span >Name: <span className='text-teal-400'>{session.display_name}</span></span>
            <span >SessionId: <span className='text-amber-400'>{session.session_id}</span></span>
            <AnimatePresence mode="wait">
                {isHovered && (
                    <motion.div 
                        className="absolute flex items-center justify-center w-full h-full  bg-neutral-700/40 backdrop-blur-sm font-sans rounded-lg max-sm:text-sm left-0 top-0"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        key="dragging-overlay"
                    >
                        <span className='font-bold'>Join</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}