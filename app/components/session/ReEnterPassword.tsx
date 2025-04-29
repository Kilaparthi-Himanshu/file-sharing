'use client';

import { sessionPassword } from '@/app/Atoms/atoms';
import revalidatePassword from '@/app/functions/session/revalidatePassword';
import { usePasswordEye } from '@/app/utils/hooks/usePasswordEye';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const ReEnterPassword = ({ sessionId }: { sessionId: string }) => {
    const {isHidden, PasswordEye} = usePasswordEye();
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [currentSessionPassword, setCurrentSessionPassword] = useAtom(sessionPassword);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const password = formData.get('password')!.toString();

        if (!password) {
            setErrorMessage("Please Enter a password !");
            return;
        }

        const response = await revalidatePassword({ sessionId, password });

        if (response.status === 'error') {
            setErrorMessage(response.message);
            return;
        }

        setCurrentSessionPassword(password);
        router.refresh();
    }

    return (
        <div className='absolute w-[100dvw] h-[100dvh] top-0 left-0 flex items-center justify-center bg-black px-2 py-2 z-200'>
            <form className='w-120 h-max bg-black border border-neutral-500 rounded-xl flex flex-col items-center gap-6 p-8 justify-around' onSubmit={handleSubmit}>
                <span className='text-4xl font-light text-center'>Re-Enter the Session Password</span>
                <div className='w-full relative mt-10'>
                    <input type={isHidden ? 'password' : 'text'} name='password' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] pr-10 pl-10`} placeholder='Enter Session Password'/>
                    <PasswordEye />
                </div>
                <div className="w-full flex items-center mt-8 justify-between">
                    <button className="w-40 h-auto min-h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] cursor-pointer active:scale-98 disabled:opacity-70 text-white text-xl">
                        Submit
                    </button>
                    <span className={`text-lg text-red-400 ml-8`}>{errorMessage}</span>
                </div>
                <Link href='/session' className='underline text-neutral-300 hover:text-neutral-400'>Back to Session Menu</Link>
                <Link href='/' className='underline text-neutral-300 hover:text-neutral-400'>Back to Main Menu</Link>
            </form>
        </div>
    );
}
