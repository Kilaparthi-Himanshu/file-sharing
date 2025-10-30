import React from 'react';
import { FaKey } from "react-icons/fa";
import { FaUserLarge } from "react-icons/fa6";

const sideBarComponents = [{
    key: 'api_keys',
    title: "API Keys",
    icon: (
        <FaKey size={20} />
    )
}, {
    key: 'profile',
    title: "Profile",
    icon: (
        <FaUserLarge size={20} />
    )
}] as const;

export type SideBarOptionTypes = (typeof sideBarComponents)[number]['key'];

export default function Sidebar({
    openSidebar,
    menu, 
    setMenu
}: {
    openSidebar: boolean;
    menu: string;
    setMenu: React.Dispatch<React.SetStateAction<SideBarOptionTypes>>;
}) {
    return (
        <nav className={`overflow-hidden duration-200 ease-in-out
        transform transition-all bg-neutral-900 h-full w-[300px] min-w-[250px] rounded-2xl flex flex-col items-center p-2 gap-2 max-md:absolute max-md:left-2 max-md:bottom-2 max-md:top-2 max-md:h-auto max-md:bg-neutral-950 max-md:max-w-[250px] ${openSidebar ? 'max-md:translate-x-0' : 'max-md:-translate-x-[105%]'}`}>
            {sideBarComponents.map(comp => 
                <SidebarCard comp={comp} key={comp.key} menu={menu} setMenu={setMenu} />
            )}
        </nav>
    );
}

function SidebarCard({ 
    comp, 
    menu,
    setMenu
}: { 
    comp: typeof sideBarComponents[number],
    menu: string;
    setMenu: React.Dispatch<React.SetStateAction<SideBarOptionTypes>>;
}) {
    return (
        <div 
            className={`hover:bg-neutral-700 w-full h-[40px] text-white font-semibold flex items-center p-2 px-4 rounded-lg justify-between ${menu === comp.key && 'bg-neutral-800'}`}
            onClick={() => setMenu(comp.key)}
        >
            <span>{comp.title}</span>
            {comp.icon}
        </div>
    );
}
