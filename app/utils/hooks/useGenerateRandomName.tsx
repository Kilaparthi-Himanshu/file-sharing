'use client';

import { useCallback, useEffect, useState } from "react";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { FaRandom } from "react-icons/fa";
import { motion } from 'framer-motion';

export const useGenerateRandomName = () => {
    const [randomName, setRandomName] = useState<string>('');
    const [isRotating, setIsRotating] = useState<boolean>(false);
    const generateRandomName = () => {
        const name = uniqueNamesGenerator({
            dictionaries: [adjectives, animals],
            separator: '-',
            style: 'lowerCase'
        });
        setRandomName(name);
    }
    useEffect(() => {
        generateRandomName();
    }, []);

    const RandomNameButton = useCallback(() => {
        return (
            <motion.div 
                className={`absolute top-[12px] right-3`}
                animate={{ rotateX: isRotating ? 360 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                onClick={() => {
                    setIsRotating(true);
                    generateRandomName();
                    setTimeout(() => setIsRotating(false), 500);
                }}
                title={'Randomize'}
            >
                <FaRandom
                    size={25}
                />
            </motion.div>
        )
    }, [isRotating]);

    return {randomName, setRandomName, RandomNameButton};
}