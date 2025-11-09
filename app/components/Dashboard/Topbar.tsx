'use client';

import { profileAtom } from '@/app/Atoms/atoms';
import { useAtomValue } from 'jotai';
import React from 'react'
import { FiMenu } from 'react-icons/fi'

export default function Topbar({
    openSidebar,
    setOpenSidebar
}: {
    openSidebar: boolean;
    setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const profile = useAtomValue(profileAtom);
    return (
        <div className='w-full h-max p-2 pb-0'>
            <div className='w-full h-[50px] bg-neutral-900 rounded-2xl flex items-center justify-center relative'>
                <div className='absolute w-max h-full left-0 flex items-center justify-center px-4'>
                    <button className='max-md:block hidden left-2 top-2 text-white active:scale-95' onClick={() => setOpenSidebar(!openSidebar)}>
                        <FiMenu size={26} />
                    </button>
                </div>
                <div className='w-full flex items-center justify-end px-2 h-max'>
                    <PlanBanner plan={profile?.plan} />
                </div>
            </div>
        </div>
    );
}

const PlanBanner = ({ plan }: { plan: string | undefined }) => {
    return (
        <>
            {plan === 'free' && (
                <div className='bg-blue-800/40 border border-blue-600 rounded-lg h-max'>
                    <span className='text-white px-2 py-1 capitalize inline-block'>
                        {plan}
                    </span>
                </div>
            )}

            {plan === 'starter' && (
                <div className='bg-purple-800/40 border border-purple-600 rounded-lg h-max'>
                    <span className='text-white px-2 py-1 capitalize inline-block'>
                        {plan}
                    </span>
                </div>
            )}

            {plan === 'pro' && (
                <div className='bg-green-800/40 border border-green-600 rounded-lg h-max'>
                    <span className='text-white px-2 py-1 capitalize inline-block'>
                        {plan}
                    </span>
                </div>
            )}
        </>
    );
}
