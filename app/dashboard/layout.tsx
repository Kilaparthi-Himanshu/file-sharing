'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import AnimatedCursor from "react-animated-cursor"
import AuthProvider from "../providers/AuthProvider";
import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { profileAtom, userAtom } from '../Atoms/atoms';
import Sidebar, { SideBarOptionTypes } from '../components/Dashboard/Sidebar';
import Topbar from '../components/Dashboard/Topbar';
import { ToastContainer } from "react-toastify";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const profile = useAtomValue(profileAtom);
    const [openSidebar, setOpenSidebar] = useState(false);

    return (
        <div className={`selection:bg-emerald-600! selection:text-white min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}>
            <div className="pointer-coarse:hidden">
                <AnimatedCursor
                    color="78, 181, 147"
                />
            </div>
            <AuthProvider>
                <div className='w-screen h-screen bg-black flex flex-col'>
                    <Topbar openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
                    <div className='w-full h-full flex flex-row p-2 gap-2 relative overflow-hidden'>
                        <Sidebar openSidebar={openSidebar}/>
                        <div className='bg-neutral-900 h-full w-full rounded-2xl overflow-y-auto'>
                            {children}
                        </div>
                    </div>
                </div>
            </AuthProvider>

            <ToastContainer />
        </div>
    );
}
