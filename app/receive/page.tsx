import React from 'react';
import { FileDownload } from '../components/FileDownload';

export default function Receive() {
    return (
        <div className='bg-black h-screen w-screen flex flex-col gap-15 items-center justify-center p-4 text-white'>
           <div className='border border-neutral-500 w-120 h-auto rounded-xl flex flex-col items-center px-8 py-8'>
                <span className='font-light text-4xl mb-2'>DOWNLOAD</span>
                <FileDownload />
           </div>
        </div>
    );
}
