'use client';

import { notifyError, notifySuccess } from '@/app/components/Alerts';
import { updateUser } from '@/app/utils/auth';
import { usePasswordEye } from '@/app/utils/hooks/usePasswordEye';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function reset() {
    const { isHidden, PasswordEye } = usePasswordEye();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const router = useRouter();
    const { mutateAsync: userUpdate, isPending: isPendingResetPassword } = useMutation({
        mutationFn: updateUser
    });

    const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const password = formData.get('password')?.toString();
        const confirmPassowrd = formData.get('confirm-password')?.toString();

        if (!password || !confirmPassowrd) {
            setErrorMessage("All Fields Must Be Filled!");
            return;
        }

        if (password !== confirmPassowrd) {
            setErrorMessage("Passwords Must Match!");
        }

        const data = await userUpdate({ password });

        if (data.status == 'error') {
            setErrorMessage("Invalid!");
            notifyError(data.message);
            return;
        }

        setErrorMessage("Success!");
        notifySuccess({ 
            message: data.message, 
            onClose: () => router.push('/developers'),
            time: 2000, 
            hideProgressBar: false 
        });
    }

    return (
        <div className='w-[100dvw] h-[100dvh] bg-neutral-950 backdrop-blur-md flex items-center justify-center z-205 text-white p-2 font-sans'>
            <div className='bg-black border border-neutral-500 p-8 text-xl w-[500px] h-max rounded-xl font-normal relative max-h-[100dvh]'>
                <form 
                    onSubmit={handlePasswordReset} 
                    className='w-full h-full flex flex-col items-center justify-center gap-8'
                >
                    <span className='text-4xl font-semibold'>
                        Password Reset
                    </span>

                    <div className='w-full flex flex-col gap-2'>
                        <span>Password:</span>
                        <div className='w-full relative'>
                            <input name='password' type={isHidden ? 'password' : 'text'} className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Password'/>
                            <PasswordEye />
                        </div>
                    </div>

                    <div className='w-full flex flex-col gap-2'>
                        <span>Confirm Password:</span>
                        <div className='w-full relative'>
                            <input name='confirm-password' type={isHidden ? 'password' : 'text'} className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} placeholder='Enter Password'/>
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
                </form>
            </div>
        </div>
    );
}
