import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { FaRegCopy } from 'react-icons/fa';

export const CopyButton = ({ textIsCopied, handleCopy }: {textIsCopied: boolean, handleCopy: () => void
}) => {
    return (
        <AnimatePresence mode="wait">
            {!textIsCopied ? (
                <motion.div
                    key="copyIcon"
                    className="absolute bg-neutral-900 rounded-full w-max h-max right-2 bottom-2 p-2 active:scale-95 cursor-pointer"
                    title="Copy Text"
                    onClick={handleCopy}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <FaRegCopy size={20} />
                </motion.div>
            ) : (
                <motion.div
                    key="textCopied"
                    className="absolute bg-neutral-900 rounded-lg w-max h-max right-2 bottom-2 p-2"
                    title="Text Copied"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <span className="text-green-400">Text Copied!</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
