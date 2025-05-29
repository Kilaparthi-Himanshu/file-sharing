'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import { notifyError } from '@/app/components/Alerts';
import { useDeleteSession } from '@/app/utils/hooks/session/useDeleteSession';
import { useQueryClient } from '@tanstack/react-query';

type DeleteModalProps = {
    isOpen?: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sessionId: string;
}

const DeleteModal = ({setIsOpen, sessionId}: DeleteModalProps) => {;
    const { mutateAsync: deleteSession } = useDeleteSession(sessionId);
    const queryClient = useQueryClient();

    const handleConfirm = async () => {
        try {
            await deleteSession();
            queryClient.invalidateQueries({queryKey: ['sessions']});
            setIsOpen(false);
        } catch (error) {
            notifyError('Unable To Delete Session');
        }
    }

    const handleReject = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.stopPropagation()
        setIsOpen(false);
    }

    return (
        <motion.div 
            className='fixed top-0 left-0 w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-md flex items-center justify-center z-205 text-white p-2'
            onClick={handleReject}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            key={sessionId}
        >
            <motion.div 
                className='w-120 h-60 bg-black border border-neutral-600 rounded-xl flex flex-col py-4' 
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className='flex-3/4 flex flex-col items-center justify-center gap-2 text-2xl border-b border-neutral-600 pb-3'>
                    <IoWarningOutline size={60} className='text-red-400' />
                    <span>Are You sure ?</span>
                    <span className='text-xl text-neutral-300'>This action can't be reverted !</span>
                </div>
                <div className='flex-1/4 flex items-center justify-end p-4 gap-2'>
                    <button 
                        className='bg-neutral-700 rounded-lg border border-neutral-500 px-6 py-2 text-white active:scale-95 active:bg-neutral-800 transition-[scale,background]'
                        onClick={handleReject}
                    >
                        Cancel
                    </button>
                    <button 
                        className='bg-red-900 rounded-lg border border-red-500 px-6 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background]'
                        onClick={handleConfirm}
                    >
                        Delete
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export const DeleteSessionModalRenderer = ({ isOpen, setIsOpen, sessionId}: DeleteModalProps) => {

    return (
        <AnimatePresence>
            {isOpen && <DeleteModal setIsOpen={setIsOpen} sessionId={sessionId} />}
        </AnimatePresence>
    );
}
