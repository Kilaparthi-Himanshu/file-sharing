'use client';

import React, { useState } from 'react';
import { FeedbackTypes } from './Feedback';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import submitFeedback from '@/app/functions/submitFeedback';
import { useMutation } from '@tanstack/react-query';
import { notifySuccess } from '../Alerts';

type FeedbackModalTypes = {
    feedbackType: FeedbackTypes;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}


const FeedbackModal = ({ feedbackType, setIsOpen }: Omit<FeedbackModalTypes, 'isOpen'>) => {
    const [errorMessage, setErrorMessage] = useState<string>("");
    const feedbackLabel: Record<FeedbackTypes, string> = {
        'feature': 'Feature Request',
        'suggestion': 'Suggestion'
    }
    const { mutateAsync: feedbackSubmit, isPending } = useMutation({
        mutationFn: async ({
            feedbackType,
            title,
            description
        }: {
            feedbackType: FeedbackTypes,
            title: string
            description: string
        }) => await submitFeedback({ feedbackType, title, description })
    });

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        setErrorMessage("");

        const description = formData.get('description')?.toString();
        const title = formData.get('title')?.toString();

        if (!title?.trim()) {
            setErrorMessage("Title Is Required");
            return;
        }
        if (!description?.trim()) {
            setErrorMessage("Description Is Required");
            return;
        }

        const data = await feedbackSubmit({ feedbackType, title,  description });
        if (data.status === 'error') {
            setErrorMessage(data.message);
            return;
        }

        notifySuccess({ message: data.message, onClose: () => setIsOpen(false), time: 1000, hideProgressBar: false });
    }

    return (
        <motion.div 
            className='fixed top-0 left-0 w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-md flex items-center justify-center z-205 text-white p-2 font-sans'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div 
                className='bg-black border border-neutral-500 p-8 text-xl w-[500px] h-max rounded-xl font-normal relative max-h-[100dvh]'
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <form onSubmit={handleSubmit} className='w-full h-full flex flex-col items-center justify-center'>
                    <IoClose className='absolute top-2 right-2 text-white' size={34} onClick={handleClose} />
                    <span className='text-4xl font-light'>Feedback</span>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Feedback Type:</span>
                        <div className='w-full relative'>
                            <input name='feedbackType' type="text" className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-neutral-400`} defaultValue={
                                feedbackLabel[feedbackType] // .notation means it looks literally for feedbackType
                            } readOnly/>
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Title:</span>
                        <div className='w-full relative'>
                            <input name='title' type="text" className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white`} placeholder='Enter Feedback Title'/>
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Description:</span>
                        <div className='w-full relative'>
                            <textarea name='description' className={`border border-neutral-600 w-full min-h-50 rounded-lg flex items-center p-2 text-[18px] font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white max-h-100 custom-scrollbar`} placeholder='Enter Feedback Description'/>
                        </div>
                    </div>

                    <div className="w-full flex items-center mt-8 justify-between">
                        <button className="w-40 h-auto min-h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] active:scale-98 disabled:opacity-70">
                            Submit
                        </button>

                        <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-8`}>
                            {errorMessage}
                        </span>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

const FeedbackModalRenderer = ({ feedbackType, isOpen, setIsOpen }: FeedbackModalTypes) => {
    return (
        <AnimatePresence>
            {isOpen && <FeedbackModal feedbackType={feedbackType} setIsOpen={setIsOpen} />}
        </AnimatePresence>
    );
}

export default FeedbackModalRenderer;