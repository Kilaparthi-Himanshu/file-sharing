import React from 'react'
import { FiMenu } from 'react-icons/fi'

export default function Topbar({
    openSidebar,
    setOpenSidebar
}: {
    openSidebar: boolean;
    setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return (
        <div className='w-full h-max p-2 pb-0'>
            <div className='w-full h-[50px] bg-neutral-900 rounded-2xl flex items-center justify-center relative'>
                <div className='absolute w-max h-full left-0 flex items-center justify-center px-4'>
                    <button className='max-md:block hidden left-2 top-2 text-white active:scale-95' onClick={() => setOpenSidebar(!openSidebar)}>
                        <FiMenu size={26} />
                    </button>
                </div>
            </div>
        </div>
    )
}
