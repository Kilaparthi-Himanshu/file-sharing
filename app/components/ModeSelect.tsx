'use client';
import React, { useEffect, useRef, useState } from 'react';
import { selectModeAtom } from '../Atoms/atoms';
import { useAtom } from 'jotai';
import { FaArrowDown } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { AnimatePresence, motion } from 'framer-motion';

export const ModeSelect = () => {
    const [mode, setMode] = useAtom(selectModeAtom);
    const [openModeModal, setOpenModeModal] = useState(false);
    const openModeModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openModeModalRef.current && !openModeModalRef.current.contains(e.target as Node)) {
                setOpenModeModal(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleModeChange = (mode: string) => {
        setMode(mode);
        setTimeout(() => {
            setOpenModeModal(false);
        }, 200);
    }

    return (
        <div className='absolute top-0 left-0 m-2' ref={openModeModalRef}>
            <div className='w-30 h-full border border-neutral-700 rounded-lg flex items-center p-2 justify-between mb-2 text-xl max-lg:hidden' onClick={() => setOpenModeModal(!openModeModal)}>
                {mode}
                <FaArrowDown size={20} className={`transition-[rotate] ${openModeModal && 'rotate-180'}`} />
            </div>

            <div className='lg:hidden' onClick={() => setOpenModeModal(!openModeModal)}>
                <RxHamburgerMenu size={30} />
            </div>

            <AnimatePresence>
                {openModeModal && (
                    <motion.div className='w-30 h-full border border-neutral-700 rounded-lg flex justify-center p-2 flex-col gap-2 text-xl bg-black' 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.1 }}
                    >
                        <div className='flex items-center justify-between px-2' onClick={() => handleModeChange("File")}>
                            File
                            {mode == "File" && <FaCheck size={18} />}
                        </div>

                        <div className='border-b border-neutral-700'></div>

                        <div className='flex items-center justify-between px-2' onClick={() => handleModeChange("Text")}>
                            Text
                            {mode == "Text" && <FaCheck size={18} />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
