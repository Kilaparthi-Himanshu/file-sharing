'use client';

import React from 'react'
import { OpeningPageTextAnimation } from '../components/misc/OpeningPageTextAnimation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CodeBlockComponent from '../components/developers/CodeBlock';
import dedent from "dedent";

export default function Developers () {
    useGSAP(() => {
        gsap.to("#opening-text", {
            duration: 0.5,
            ease: "power1.out",
            delay: 0.2,
            opacity: 1,
            stagger: 0.2
        });
    });

    return (
        <div>
            <div className="bg-black flex flex-col gap-15 items-center justify-center noise-texture">
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

                <div className='h-[100dvh] w-max'>
                    
                </div>
            </div>
        </div>
    );
}
