'use client'

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import RegenarateIcon from './RegenerateIcon';
import { useGenerateRandomName } from '@/app/utils/hooks/useGenerateRandomName';
import { usePasswordEye } from '@/app/utils/hooks/usePasswordEye';
import { useRouter } from 'next/navigation';

export default function CreateSessionModal({removeModal} : {removeModal: () => void}) {
    const [sessionId, setSessionId] = useState<string>("");
    const {randomName, setRandomName, RandomNameButton} = useGenerateRandomName();
    const {isHidden, PasswordEye} = usePasswordEye();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const router = useRouter();

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
        setSessionId(Math.floor(100000 + Math.random() * 900000).toString());
    }

    function createSession(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        setErrorMessage("");

        const username = formData.get('username');
        const password = formData.get('password');
        const sessionId = formData.get('sessionId')

        if (!username) {
            setErrorMessage("Please Enter a Username");
            return;
        }

        if (!password) {
            setErrorMessage("Please Enter a Password");
            return;
        }

        console.log(username);
        console.log(sessionId);
        console.log(password);

        router.push(`/session/${sessionId}`);
    }

    return (
        <motion.div
            className="w-[100dvw] h-[100dvh] fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={removeModal}
        >
            <motion.div 
                className="bg-black border border-neutral-500 p-8 text-xl w-[500px] h-max rounded-xl font-normal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} // prevent backdrop click
            >
                <form onSubmit={createSession} className='w-full h-full flex flex-col items-center justify-center'>
                    <span className='text-4xl font-light'>Create Session</span>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Session ID:</span>
                        <div className='w-full relative'>
                            <input type="text" name='sessionId' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-neutral-400`} maxLength={6} defaultValue={sessionId} readOnly/>
                            <RegenarateIcon generateNewId={generateNewId} />
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Display Name:</span>
                        <div className='w-full relative'>
                            <input type="text" name='username' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} value={randomName} onChange={(e) => setRandomName(e.target.value)} />
                            <RandomNameButton />
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-2 mt-8'>
                        <span>Session Password:</span>
                        <div className='w-full relative'>
                            <input type={isHidden ? 'password' : 'text'} name='password' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] pr-10 pl-10`} placeholder='Enter Session Password' />
                            <PasswordEye />
                        </div>
                    </div>

                    <div className="w-full flex items-center mt-8 justify-between">
                        <button className="w-40 h-auto min-h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] cursor-pointer active:scale-98">
                            Create Session
                        </button>

                        <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-8`}>{errorMessage}</span>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}