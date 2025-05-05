'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from "gsap";
import SplitText from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export const OpeningPageTextAnimation = () => {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (textRef.current) {
            const split = new SplitText(textRef.current, {
                type: 'chars,words',
                charsClass: 'char',
                wordsClass: 'word'
            });

            gsap.set(split.chars, {
                y: -100,
                opacity: 0,
                letterSpacing: '10px',
            });

            gsap.to(split.chars,{
                y: 0,
                opacity: 1,
                stagger: 0.05,
                delay: 0.2,
                duration: 0.1,
                ease: "power4.out",
            });
        }
    }, []);

    return (
        <div id='title' ref={textRef} className='tracking-[10px] text-shadow-lg text-shadow-blue-500/80'>
           BlinkShare
        </div>
    );
}
