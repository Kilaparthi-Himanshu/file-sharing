'use client';

import { useEffect, useState } from "react";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { FaRandom } from "react-icons/fa";

export const useGenerateRandomName = () => {
    const [randomName, setRandomName] = useState<string>('');
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

    const RandomNameButton = () => {
        return (
            <FaRandom 
                className="absolute top-[12px] right-2 transition-transform duration-500" 
                onClick={generateRandomName}
                size={25}
            />
        )
    }

    return {randomName, RandomNameButton};
}