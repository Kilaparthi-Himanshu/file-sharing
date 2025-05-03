'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { getUserSessions } from '@/app/functions/session/getUserSessions';
import { useQuery } from '@tanstack/react-query';
import { SpinnerRenderer } from '../Spinner';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { sessionPassword } from '@/app/Atoms/atoms';
import { FaRegSadTear } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi2";
import { DeleteSessionButton } from './DeleteSessionButton';

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
                    className="bg-black border border-neutral-500 text-xl w-[500px] h-max rounded-xl font-normal relative flex flex-col items-center bg-[url(https://transparenttextures.com/patterns/black-orchid.png)]"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()} // prevent backdrop click
                >
                    <div className='mb-2 border-b border-neutral-600 w-full h-15 flex items-center p-4 font-bold'>
                        My Sessions
                    </div>
                    <IoClose className='absolute top-4 right-2 text-white' size={26} onClick={removeModal} />
                    <div className='w-full flex flex-col items-center h-120 overflow-y-auto custom-scrollbar gap-4 p-4'>
                         {isPending ? (
                            <SpinnerRenderer />
                        ) :
                            sessions && sessions.length > 0 ? (
                            sessions.map(session => (
                                <SessionBanner session={session} key={session.session_id}/>
                            ))
                        ) : (
                            <div className='h-full w-full flex flex-col items-center justify-center text-2xl font-bold text-neutral-400'>
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
    const btnRef = useRef<HTMLDivElement>(null!); // non-null assertion

    return (
        <div className='w-full flex items-center border border-neutral-600 bg-black rounded-lg'>
            <div 
            className='w-full h-max p-2 pl-4 flex flex-col items-start relative transition-[scale] text-[18px] gap-2' onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            >
                <span >Name: <span className='text-teal-400 font-semibold'>{session.display_name}</span></span>
                <span >SessionId: <span className='text-amber-400'>{session.session_id}</span></span>
                <AnimatePresence mode="wait">
                    {isHovered && (
                        <motion.div 
                            className="absolute flex items-center justify-center w-full h-full  bg-neutral-700/40 backdrop-blur-sm font-sans rounded-lg rounded-r-none max-sm:text-sm left-0 top-0 active:bg-neutral-900/40 transition-[background]"
                            initial={{ opacity: 0}}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            key="dragging-overlay"
                        >
                            <span className='font-bold'>Join</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <span className="flex size-3 absolute left-[-5] top-[-5]">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75`}></span>
                    <span className={`relative inline-flex size-3 rounded-full bg-green-400`}></span>
                </span>
            </div>
            <div className='w-max h-full flex items-center justify-center border-l border-neutral-600 p-4 hover:bg-neutral-800 transition-[background]' onClick={() => btnRef.current.click()}>
                <DeleteSessionButton sessionId={session.session_id} buttonRef={btnRef}>
                    <HiOutlineTrash size={26} className='text-red-600' />
                </DeleteSessionButton>
            </div>
        </div>
    );
}