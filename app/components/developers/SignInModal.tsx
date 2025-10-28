'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { usePasswordEye } from '@/app/utils/hooks/usePasswordEye';
import { notifyError, notifySuccess } from '../Alerts';
import { useMutation } from '@tanstack/react-query';
import { signUpUser, SignUpDetailsTypes, signInUser } from '@/app/utils/auth';
import { SpinnerRenderer } from '../Spinner';

export const SignInModal = ({ 
    setIsOpen 
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    useEffect(() => {
        // disable scroll on open
        document.body.style.overflow = 'hidden';

        return () => {
            // enable scroll on close
            document.body.style.overflow = 'auto';
        };
    }, []);

    const { isHidden, PasswordEye } = usePasswordEye();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [actionType, setActionType] = useState<'signup' | 'signin'>('signin');

    const { mutateAsync: signUp, isPending: isPendingSignUp } = useMutation({
        mutationFn: signUpUser
    });

    const { mutateAsync: signIn, isPending: isPendingSignIn } = useMutation({
        mutationFn: signInUser
    })

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
    }

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const full_name = formData.get('full_name')?.toString();
        const username = formData.get('username')?.toString();
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        if (!full_name || !username || !email || !password) {
            setErrorMessage("All Fields Must Be Filled!");
            return;
        }

        const data = await signUp({ full_name, username, email, password });

        if (data.status == 'error') {
            setErrorMessage("Invalid!");
            notifyError(data.message);
            return;
        }

        setErrorMessage("Success!");
        notifySuccess({ 
            message: data.message, 
            // onClose: () => setIsOpen(false), 
            time: 3000, 
            hideProgressBar: false 
        });
    }

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        if (!email || !password) {
            setErrorMessage("All Fields Must Be Filled!");
            return;
        }

        const data = await signIn({ email, password });

        if (data.status == 'error') {
            setErrorMessage("Invalid!");
            notifyError(data.message);
            return;
        }

        setErrorMessage("Success!");
        notifySuccess({ 
            message: data.message, 
            onClose: () => setIsOpen(false),
            time: 1000, 
            hideProgressBar: false 
        });
    }

    return (
        <>
            {(isPendingSignUp || isPendingSignIn) && <SpinnerRenderer />}

            <motion.div
                className='fixed top-0 left-0 w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-md flex items-center justify-center z-205 text-white p-2 font-sans'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleClose}
            >
                <AnimatePresence mode='wait'>
                    <motion.div 
                        key={actionType}
                        layout
                        className='bg-black border border-neutral-500 p-8 text-xl w-[500px] h-max rounded-xl font-normal relative max-h-[100dvh]'
                        onClick={(e) => e.stopPropagation()}
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <form 
                            onSubmit={(e) => {
                                if (actionType === 'signup') {
                                    handleSignUp(e);
                                } else {
                                    handleSignIn(e);
                                }
                            }} 
                            className='w-full h-full flex flex-col items-center justify-center gap-8'
                        >
                            <IoClose className='absolute top-2 right-2 text-white' size={34} onClick={handleClose} />

                            <span className='text-4xl font-semibold'>
                                {actionType === 'signup' ? "Sign Up" : "Sign In"}
                            </span>

                            {actionType === 'signup' &&
                            <div className='w-full flex flex-col gap-2'>
                                <span>Full Name:</span>
                                <div className='w-full relative'>
                                    <input name='full_name' type="text" className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Full Name'/>
                                </div>
                            </div>}

                            {actionType === 'signup' &&
                            <div className='w-full flex flex-col gap-2'>
                                <span>Username:</span>
                                <div className='w-full relative'>
                                    <input name='username' type="text" className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Username'/>
                                </div>
                            </div>}

                            <div className='w-full flex flex-col gap-2'>
                                <span>Email:</span>
                                <div className='w-full relative'>
                                    <input name='email' type="text" className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Email'/>
                                </div>
                            </div>

                            <div className='w-full flex flex-col gap-2'>
                                <span>Passowrd:</span>
                                <div className='w-full relative'>
                                    <input name='password' type={isHidden ? 'password' : 'text'} className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Password'/>
                                    <PasswordEye />
                                </div>
                            </div>

                            <div className="w-full flex items-center justify-between">
                                <button className="w-40 h-auto min-h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] active:scale-98 disabled:opacity-70">
                                    Submit
                                </button>

                                <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-8`}>
                                    {errorMessage}
                                </span>
                            </div>

                            <div className="h-full flex items-center">
                                {actionType === 'signup' ? (
                                    <div className="flex flex-col items-center justify-center text-lg text-center">
                                        <span className="text-[13px]">
                                            Already have an account?
                                        </span>

                                        <button className="underline" type="button" onClick={() => setActionType('signin')}>
                                            Sign In
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-lg text-center">
                                        <span className="text-[13px]">
                                            Don't have an account?
                                        </span>

                                        <button className="underline" type="button" onClick={() => setActionType('signup')}>
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </>
    );
}
