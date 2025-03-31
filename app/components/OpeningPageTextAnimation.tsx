'use client';

import React, { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import { gsap } from "gsap";

export const OpeningPageTextAnimation = () => {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (textRef.current) {
            const text = new SplitType(textRef.current, {
                types: 'words,chars',
                tagName: 'span'
            });

            gsap.set('.char', {
                y: 100,
                opacity: 0,
                letterSpacing: '10px'
            });

            gsap.to('.char',{
                y: 0,
                opacity: 1,
                stagger: 0.05,
                delay: 0.2,
                duration: 0.1,
                ease: "power4.out"
            });
        }
    }, []);

    return (
        <div id='title' ref={textRef} className='tracking-[10px]'>
           Blinkshare
        </div>
    );
}
