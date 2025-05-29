import { motion } from 'framer-motion';
import React from 'react';
import { FaRegCopy } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa";
import { IoClose } from 'react-icons/io5';
import { notifySuccess } from '../Alerts';

export const ShareModal = ({ setIsOpen }: { setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const url = 'https://blinkshare.vercel.app';
    const message = 'Check this out!';
    const fullMessage = `${message} ${url}`;

    const links = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(message)}`,
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        notifySuccess({ 
            message: 'Link Copied To Clipboard!', 
            time: 1000,
            hideProgressBar: false
        });
    };

    return (
        <motion.div 
            className='fixed top-0 left-0 w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-md flex items-center justify-center z-205 text-white p-2 font-sans'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
            }}
        >
            <motion.div 
                className='bg-black border border-neutral-500 p-8 text-xl w-max h-max rounded-xl font-normal relative max-h-[100dvh] flex flex-col gap-10'
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <IoClose className='absolute top-2 right-2 text-white' size={34} onClick={() => setIsOpen(false)} />
                <div className='text-4xl font-light w-full text-center'>
                    Share
                </div>
                <div className='flex flex-col w-full items-center justify-between gap-8'>
                    <div className='hover:bg-neutral-900  border-neutral-600 w-full h-12 rounded-lg flex items-center p-4 text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white space-x-4' onClick={handleCopy}>
                        <FaRegCopy size={30} />
                        <span>Copy Link!</span>
                    </div>
                    <a 
                        className='hover:bg-neutral-900 border-neutral-600 w-full h-12 rounded-lg flex items-center p-4 text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white space-x-4' 
                        href={links.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                            <FaWhatsapp size={30} />
                            <span>Share On Whatsapp!</span>
                    </a>
                    <a 
                        className='hover:bg-neutral-900 border-neutral-600 w-full h-12 rounded-lg flex items-center p-4 text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white space-x-4'
                        href={links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                            <FaXTwitter size={30} />
                            <span>Share On Twitter!</span>
                    </a>
                    <a 
                        className='hover:bg-neutral-900 border-neutral-600 w-full h-12 rounded-lg flex items-center p-4 text-xl font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-white space-x-4'
                        href={links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaLinkedinIn size={30} />
                        <span>Share On LinkedIn!</span>
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
}


{/* <div className='w-full items-center justify-center gap-8 flex h-max'>
                    <div className='flex items-center flex-col justify-center gap-2 min-w-22 hover:bg-neutral-900 p-2 rounded-2xl'>
                        <FaRegCopy size={30} />
                        Copy
                    </div>
                    <div className='flex items-center flex-col justify-center gap-2 min-w-22 hover:bg-neutral-900 p-2 rounded-2xl'>
                        <FaWhatsapp size={30} />
                        Whatsapp
                    </div>
                    <div className='flex items-center flex-col justify-center gap-2 min-w-22 hover:bg-neutral-900 p-2 rounded-2xl'>
                        <FaXTwitter size={30} />
                        Twitter (X)
                    </div>
                </div> */}