'use client';

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { profileAtom, userAtom } from '../Atoms/atoms';
import Sidebar, { SideBarOptionTypes } from '../components/Dashboard/Sidebar';
import Topbar from '../components/Dashboard/Topbar';
import Content from '../components/Dashboard/Content';

export default function Dashboard () {
    const profile = useAtomValue(profileAtom);
    const [openSidebar, setOpenSidebar] = useState(false);
    const [menu, setMenu] = useState<SideBarOptionTypes>('api_keys');

    if (!profile) {
        return (
            <div>
                GGWP
            </div>
        );
    } //TODO: Temporary loader (later replace with skeletons in code).

    return (
        <div className='w-screen h-screen bg-black flex flex-col flex-1'>
            <Topbar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
            <div className='w-full flex flex-row flex-1 bg-black p-2 gap-2 relative'>
                <Sidebar openSidebar={openSidebar} menu={menu} setMenu={setMenu} />
                <Content menu={menu} setMenu={setMenu} />
            </div>
        </div>
    );
}
