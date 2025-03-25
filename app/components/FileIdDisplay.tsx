import React from 'react';

export const FileIdDisplay = ({ fileId }: { fileId: string }) => {
    
  return (
    <div className='absolute flex flex-col max-lg:flex-row items-center w-max h-max top-0 p-4 py-0 rounded-xl'>
        <span className='tracking-normal font-bold p-2 border text-4xl border-neutral-500 px-12 rounded-b-xl border-t-0 max-lg:border-0 max-lg:px-0 max-lg:ml-4'>
            ID:
        </span>
        <div className='border border-neutral-500 rounded-b-xl border-t-0 px-3 py-2 text-center flex justify-center tracking-[8px] text-3xl max-lg:border-0'>
            {fileId}
        </div>
    </div>
  );
}
