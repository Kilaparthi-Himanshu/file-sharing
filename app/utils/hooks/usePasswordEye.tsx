'use client';

import React, { useCallback, useState } from 'react';
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

export const usePasswordEye = () => {
    const [isHidden, setIsHidden] = useState<boolean>(true);

    const PasswordEye = useCallback(() => {
        return (
            <div className='absolute top-[11px] right-2' onClick={() => setIsHidden(!isHidden)}>
                <motion.div
                    key={isHidden ? 'hidden' : 'visible'}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                >
                    {isHidden ? <FaRegEyeSlash size={25} /> : <FaRegEye size={25} />}
                </motion.div>
            </div>
        );
    }, [isHidden]); // useCallback ensures the component dosen't re-render on input change

    return {isHidden, PasswordEye};
}
