'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const Spinner = () => {
    return (
        <motion.div className='bg-[rgba(43,43,43,0.3)] absolute w-full h-full flex items-center justify-center py-9 px-2 z-1000 left-0 top-0' initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            <div className="flex items-center justify-center h-screen">
                <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        </motion.div>
    );
}

export const SpinnerRenderer = () => {

    return (
        <AnimatePresence>
            <Spinner />
        </AnimatePresence>
    );
}