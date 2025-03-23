import React from 'react';
import { FileInput } from '../components/FileInput';

export default function Send() {

    return (
        <div className='bg-black h-screen w-screen flex flex-col gap-15 items-center justify-center p-4 text-white'>
           <div className='border border-neutral-500 w-120 h-auto rounded-xl flex flex-col items-center px-8 py-8'>
                <FileInput />
           </div>
        </div>
    );
}
