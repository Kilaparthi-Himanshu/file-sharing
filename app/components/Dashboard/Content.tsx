import React from 'react';
import { SideBarOptionTypes } from './Sidebar';


export default function Content({ 
    menu, 
    setMenu 
}: {
    menu: string
    setMenu: React.Dispatch<React.SetStateAction<SideBarOptionTypes>>
}) {
    return (
        <div className='bg-neutral-900 h-full w-full rounded-2xl'>
            
        </div>
    );
}
