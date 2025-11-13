import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { FaKey } from "react-icons/fa";
import { FaUserLarge } from "react-icons/fa6";

const sideBarComponents = [{
    key: 'api_keys',
    title: "API Keys",
    icon: (
        <FaKey size={20} />
    ),
    link: '/dashboard/api-keys'
}, {
    key: 'profile',
    title: "Profile",
    icon: (
        <FaUserLarge size={20} />
    ),
    link: '/dashboard/profile'
}];

export default function Sidebar({
    openSidebar,
}: {
    openSidebar: boolean;
}) {
    return (
        <nav className={`overflow-hidden duration-200 ease-in-out
        transform transition-all bg-neutral-900 h-full w-[300px] min-w-[250px] rounded-2xl flex flex-col items-center p-3 gap-3 max-md:absolute max-md:left-2 max-md:bottom-2 max-md:top-2 max-md:h-auto max-md:bg-neutral-950 max-md:max-w-[250px] max-md:z-400 ${openSidebar ? 'max-md:translate-x-0' : 'max-md:-translate-x-[105%]'}`}>
            {sideBarComponents.map(comp => 
                <SidebarCard comp={comp} key={comp.key}/>
            )}
        </nav>
    );
}

function SidebarCard({ 
    comp, 
}: { 
    comp: typeof sideBarComponents[number],
}) {
    const pathname = usePathname();

    return (
        <Link 
            href={comp.link}
            className={`hover:bg-neutral-700 w-full h-[40px] text-neutral-300 font-semibold flex items-center p-2 px-4 rounded-lg justify-between ${pathname === comp.link && 'bg-neutral-800 text-white'} transition-all`}
        >
            <span>{comp.title}</span>
            {comp.icon}
        </Link>
    );
}
