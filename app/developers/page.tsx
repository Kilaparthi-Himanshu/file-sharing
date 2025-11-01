'use client';

import React, { useEffect, useState } from 'react'
import { OpeningPageTextAnimation } from '../components/misc/OpeningPageTextAnimation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CodeBlockComponent from '../components/developers/CodeBlock';
import dedent from "dedent";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CgLock } from "react-icons/cg";
import { AiOutlineThunderbolt } from "react-icons/ai";
import { IoMdCloudOutline } from "react-icons/io";
import { FaRegClock } from "react-icons/fa6";
import { supabase } from '../utils/supabase/client';
import ModalRenderer from '../components/ModalRenderer';
import { SignInModal } from '../components/developers/SignInModal';
import { ToastContainer } from "react-toastify";
import { useAtomValue } from 'jotai';
import { profileAtom } from '../Atoms/atoms';
import { useRouter } from 'next/navigation';

gsap.registerPlugin(ScrollTrigger);

export default function Developers () {
    useGSAP(() => {
        gsap.to("#opening-text", {
            duration: 0.5,
            ease: "power1.out",
            delay: 0.2,
            opacity: 1,
            stagger: 0.2
        });

        gsap.to('#features', {
            duration: 0.5,
            ease: "power1.out",
            delay: 0.5,
            opacity: 1,
            stagger: 0.2,
            scrollTrigger: {
                trigger: "#features-container",
                start: "top bottom-=100",
                id: "features-container",
                toggleActions: 'play none none reverse',
            }
        });
    });

    const [signInModalOpen, setSignInModalOpen] = useState(false);
    const profile = useAtomValue(profileAtom);
    const router = useRouter();

    return (
        <div className='w-full'>
            <button 
                className='fixed top-4 right-4 py-2 bg-emerald-500 hover:bg-emerald-600 px-6 rounded-xl z-200 transition-all outline-2 outline-transparent hover:outline-emerald-300/70 outline-offset-2 text-neutral-900 font-semibold active:scale-95' 
                onClick={() => {
                    return profile ? router.push('/dashboard') : setSignInModalOpen(true);
                }}
            >
                {profile ? 'Dashboard' : 'Sign In'}
            </button>

            <ModalRenderer isOpen={signInModalOpen}>
                <SignInModal setIsOpen={setSignInModalOpen} />
            </ModalRenderer>

            <div className="bg-black flex flex-col gap-16 items-center justify-center">
                <div className='min-h-[100dvh] flex flex-col items-center justify-center gap-15'>
                    <span className="text-white text-7xl font-bold text-center max-sm:text-5xl opacity-0" id="opening-text">
                        <OpeningPageTextAnimation shadowColor={"text-shadow-emerald-600/80"} />
                    </span>

                    <span className='text-white text-3xl font-bold text-center max-sm:text-xl opacity-0' id='opening-text'>
                        Secure, One-Click File Sharing API for Developers
                    </span>

                    <span className='text-white text-2xl text-center max-sm:text-lg opacity-0 w-[500px] max-sm:w-[400px]' id='opening-text'>
                        Generate expiring, single-use download links in seconds. Built for Next.js, Node and serverless apps.
                    </span>

                    <div className='opacity-0' id='opening-text'>
                        <CodeBlockComponent 
                            code={dedent`
                                import { Blink } from "blink-secure-links";

                                const blink = new Blink(process.env.BLINK_SECRET_KEY);

                                const url = await blink.createLink("/invoice.pdf", {
                                    expiresIn: "10m",
                                    maxClicks: 1,
                                });
                            `}
                            language='typescript'
                        />
                    </div>
                </div>

                <div className='h-max w-full'>
                    <div className='w-full h-max p-10 py-20 rounded-2xl flex flex-col items-center justify-around gap-10 bg-neutral-950' id="features-container">
                        <h2 className="text-4xl font-bold mb-10 text-white">Features</h2>

                        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-24'>
                            <div className='order-1 bg-neutral-900 outline-2 outline-emerald-300/70 outline-offset-4 w-[290px] h-[290px] rounded-4xl flex flex-col items-center justify-center p-2 opacity-0' id="features">
                                <div className='w-full flex items-center justify-center p-6 rounded-full'>
                                    <CgLock size={80} className='text-emerald-500' />
                                </div>
                                <div className='w-[300px] h-full flex flex-col gap-5 items-center justify-center text-center text-3xl font-semibold text-white'>
                                    <span>Secure by Default</span>
                                    <span className='text-lg font-normal text-neutral-300'>Expiring & one-time links with validations</span>
                                </div>
                            </div>

                            <div className='order-2 bg-emerald-800 outline-2 outline-emerald-300/70 outline-offset-4 w-[290px] h-[290px] rounded-4xl flex flex-col items-center justify-center p-2 opacity-0' id="features">
                                <div className='w-full flex items-center justify-center p-6 rounded-full'>
                                    <AiOutlineThunderbolt size={80} className='text-neutral-900' />
                                </div>
                                <div className='w-[300px] h-full flex flex-col gap-5 items-center justify-center text-center text-3xl font-semibold text-white'>
                                    <span>Instant links</span>
                                    <span className='text-lg font-normal text-neutral-300'>Generate in 1 line of code</span>
                                </div>
                            </div>

                            <div className='order-3 md:max-xl:order-4 bg-neutral-900 outline-2 outline-emerald-300/70 outline-offset-4 w-[290px] h-[290px] rounded-4xl flex flex-col items-center justify-center p-2 opacity-0' id="features">
                                <div className='w-full flex items-center justify-center p-6 rounded-full'>
                                    <FaRegClock size={80} className='text-emerald-500' />
                                </div>
                                <div className='w-[300px] h-full flex flex-col gap-5 items-center justify-center text-center text-3xl font-semibold text-white'>
                                    <span>Expiry + one-time</span>
                                    <span className='text-lg font-normal text-neutral-300'>Auto-expiry, revoke, max clicks</span>
                                </div>
                            </div>

                            <div className='order-4 md:max-xl:order-3 bg-emerald-800 outline-2 outline-emerald-300/70 outline-offset-4 w-[290px] h-[290px] rounded-4xl flex flex-col items-center justify-center p-2 opacity-0' id="features">
                                <div className='w-full flex items-center justify-center p-6 rounded-full'>
                                    <IoMdCloudOutline size={80} className='text-neutral-900' />
                                </div>
                                <div className='w-[300px] h-full flex flex-col gap-5 items-center justify-center text-center text-3xl font-semibold text-white'>
                                    <span>Storage-Friendly</span>
                                    <span className='text-lg font-normal text-neutral-300'>Expiring & one-time links with validations</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='h-screen w-full'>
                        <div className="min-h-1/2 max-h-max w-full py-32 flex flex-col items-center justify-center bg-black text-white">
                            <h2 className="text-4xl font-bold mb-10">How It Works</h2>

                            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="text-emerald-500 text-6xl font-bold mb-4">1</div>
                                    <p className="text-xl font-semibold mb-2">Upload your file</p>
                                    <p className="text-neutral-400">via dashboard or API</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="text-emerald-500 text-6xl font-bold mb-4">2</div>
                                    <p className="text-xl font-semibold mb-2">We secure and store it</p>
                                    <p className="text-neutral-400">encrypted & access-controlled</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="text-emerald-500 text-6xl font-bold mb-4">3</div>
                                    <p className="text-xl font-semibold mb-2">Share the expiring link</p>
                                    <p className="text-neutral-400">one-time or multi-use (your rules)</p>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-1/2 max-h-max w-full py-32 bg-neutral-950 text-white flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-bold mb-6">Start Securing Your Files</h2>
                            <p className="text-neutral-400 mb-10 text-center">
                                Create an account and start generating secure download links in minutes.
                            </p>

                            <button
                                onClick={async () => {
                                    // window.location.href = "/developers/docs";
                                    await supabase.auth.signOut();
                                }}
                                className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all outline-2 outline-transparent hover:outline-emerald-300/70 outline-offset-4"
                            >
                                Start Building →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
}
