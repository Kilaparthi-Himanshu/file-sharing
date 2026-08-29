'use client';

import { profileAtom } from '@/app/Atoms/atoms';
import { DeveloperProfileType } from '@/types/supabase_database.types';
import { useAtomValue } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { MdAccountCircle } from "react-icons/md";
import { FaGear } from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase/client';
import { FaHome } from "react-icons/fa";

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
                <div className='w-full flex items-center justify-end px-4 h-max gap-2'>
                    <FaHome
                        className='text-neutral-200 active:scale-90 rounded-full transition-all duration-20 mr-auto' 
                        size={32}
                        onClick={() => window.location.href = '/'}
                    />

                    <PlanBanner plan={profile?.plan} />

                    <ProfileBanner profile={profile} />
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

const ProfileBanner = ({ profile }: { profile: DeveloperProfileType | null }) => {
    const [openProfileBanner, setOpenProfileBanner] = useState(false);
    const openModeModalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openModeModalRef.current && !openModeModalRef.current.contains(e.target as Node)) {
                setOpenProfileBanner(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={openModeModalRef}>
            <MdAccountCircle 
                className='text-neutral-200 hover:outline-2 rounded-full transition-all duration-20' 
                size={36}
                onClick={() => setOpenProfileBanner(!openProfileBanner)}
            />

            <AnimatePresence mode="wait">
                {openProfileBanner && 
                    <motion.div 
                        className='absolute right-4 top-14 z-500 bg-neutral-800 rounded-2xl min-w-[200px] h-max flex flex-col items-center justify-center text-neutral-100 text-sm overflow-hidden border-2 border-neutral-600'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <div className='w-full h-max flex flex-col items-start justify-center gap-1 p-3 border-b border-b-neutral-600'>
                            <span className='font-semibold text-[16px]'>{profile?.full_name}</span>
                            <span className='text-neutral-400'>{profile?.username}</span>
                            <span className='text-neutral-400'>{profile?.email}</span>
                        </div>

                        <div 
                            className='w-full h-max flex items-center gap-4 p-3 border-b border-b-neutral-600 hover:bg-neutral-900 transition-all duration-150'
                            onClick={() => router.push('/dashboard/profile')}
                        >
                            <FaGear size={18} />
                            <span>Profile Info</span>
                        </div>

                        <div 
                            className='w-full h-max flex items-center gap-4 p-3 hover:bg-neutral-900 transition-all duration-150'
                            onClick={async () => {
                                // window.location.href = "/developers/docs";
                                await supabase.auth.signOut();
                                router.refresh();
                            }}
                        >
                            <FiLogOut size={18} />
                            <span>Log Out</span>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
}
