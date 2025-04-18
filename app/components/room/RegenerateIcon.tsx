'use client';

import { useState } from 'react';
import { IoMdRefresh } from "react-icons/io";

export default function RegenarateIcon({generateNewId}: {generateNewId: () => void})  {
    const [isRotating , setIsRotating] = useState<number>(0);

    return(
        <IoMdRefresh 
            className="absolute top-[9px] right-2 transition-transform duration-500"
            style={{ transform: `rotate(${isRotating}deg)` }}
            size={30}
            onClick={() => {
                generateNewId();
                setIsRotating(prev => prev + 360);
            }}
        />
    );
}