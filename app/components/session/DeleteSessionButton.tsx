'use client';

import React, { useState } from 'react';
import { IoWarningOutline } from "react-icons/io5";
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/app/utils/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { notifyError, notifySuccess } from "../Alerts";
import { useRouter } from 'next/navigation';

export const DeleteSessionButton = ({ sessionId }: {sessionId: string}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const { mutateAsync: deleteSession, isPending } = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('id', sessionId)

            if (error) throw error;
        }
    });

    const handleDelete = async () => {
        try {
            await deleteSession();
        } catch (error) {
            notifyError('Unable To Delete Session');
        }
    }

    return (
        <>
            <button 
                className='absolute top-2 right-2 bg-red-900 rounded-lg border border-red-500 px-4 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background]'
                onClick={() => setModalOpen(true)}
            >
                Delete Session
            </button>
            <AnimatePresence>
                {modalOpen && (
                    <motion.div 
                        className='absolute top-0 left-0 w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-md flex items-center justify-center z-202 text-white p-2'
                        onClick={() => setModalOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
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
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className='bg-red-900 rounded-lg border border-red-500 px-6 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background]'
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
