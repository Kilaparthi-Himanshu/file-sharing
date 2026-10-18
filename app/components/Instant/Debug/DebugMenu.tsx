'use client';

import React, { useState } from 'react';
import { IoMenu } from "react-icons/io5";
import DebugAckSlider from './DebugAckSlider';
import DebugChunkSizeSlider from './DebugChunkSizeSlider';

const DebugMenu = () => {
    const [mennuOpen, setMenuOpen] = useState(false);

    return (
        <div className='absolute top-2 right-2'>
            <button 
                className='p-2 rounded-full bg-red-500 flex gap-2 items-center'
                onClick={() => setMenuOpen(!mennuOpen)}
            >
                Debug <IoMenu />
            </button>

            <div className='absolute top-12 right-2'>
                {mennuOpen && (
                    <div className='bg-blue-500 p-2 w-[400px] rounded-xl border-2 flex flex-col gap-4'>
                        <DebugAckSlider />

                        <div className='w-full border'></div>

                        <DebugChunkSizeSlider />
                    </div>
                )}
            </div>
        </div>
    );
}

export default DebugMenu;
