'use client';

import { profileAtom } from "@/app/Atoms/atoms";
import { useFormattedDate } from "@/app/utils/hooks/useFormattedDate";
import { useAtomValue } from "jotai";

export default function Profile() {
    const profile = useAtomValue(profileAtom);
    const createdAtFormatted = useFormattedDate(profile?.created_at);

    return (
        <div className='w-full flex flex-col items-center p-8 gap-8'>
            <span className='text-4xl font-semibold text-white'>Profile</span>

           <div className='bg-neutral-950 w-full h-max rounded-2xl flex flex-col border border-neutral-700 p-4 text-white text-lg gap-7'>
                <span className='w-full text-white text-lg font-semibold underline'>Profile Details:</span>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Account Created:
                        </span>
                        &nbsp;
                        {createdAtFormatted}
                    </span>
                </div>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Email:
                        </span>
                        &nbsp;
                        {profile?.email}
                    </span>
                </div>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Full Name:
                        </span>
                        &nbsp;
                        {profile?.full_name}
                    </span>
                </div>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Username:
                        </span>
                        &nbsp;
                        {profile?.username}
                    </span>
                </div>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Subscription Status:
                        </span>
                        &nbsp;
                        {profile?.plan?.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
} 