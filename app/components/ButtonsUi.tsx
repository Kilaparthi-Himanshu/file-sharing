'use server';

import Link from 'next/link';
import React from 'react';
import { MdGetApp } from "react-icons/md";
import { IoIosSend } from "react-icons/io";
import { HiUserGroup } from "react-icons/hi";

export const ButtonsUi = async () => {

    return (
        <div className='w-120 flex flex-col items-center max-sm:gap-8'>
            <div className='w-120 h-max flex items-center justify-center font-mono flex-col max-sm:h-auto gap-8'>
                <Link className='border border-neutral-600 w-60 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-between bg-black px-4 motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-100' href='/send'>
                    Send
                    <IoIosSend size={30} />
                </Link>

                <Link className='border border-neutral-600 w-60 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-between bg-black px-4 motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-200' href='/receive'>
                    Receive
                    <MdGetApp size={34} />
                </Link>

                <Link className='border border-neutral-600 w-60 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-between bg-black px-4 motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-300' href='/session'>
                    Session
                    <HiUserGroup size={30} />
                </Link>
            </div>

            {/* <div className='relative motion-translate-x-in-[0%] motion-translate-y-in-[56%] motion-opacity-in-[0%] motion-blur-in-[20px] motion-delay-100'>
                <Link className='border border-neutral-600 w-40 h-15 rounded-lg text-white text-xl hover:bg-neutral-800 transition-[background,scale] cursor-pointer active:scale-98 flex items-center justify-center bg-black font-mono' href='/session'>
                    Session
                </Link>
            </div> */}
        </div>
    );
}