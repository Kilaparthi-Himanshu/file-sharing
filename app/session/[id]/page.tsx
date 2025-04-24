import React from 'react';
import SendFiles from '@/app/components/session/SendFiles';
import ReceiveFiles from '@/app/components/session/ReceiveFiles';
import { ToastContainer } from 'react-toastify';
import SessionDetailsBanner from '@/app/components/session/SessionDetailsBanner';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ participantId: string }>;
}

export default async function Session({ params, searchParams }: Props) {

    const { id } = await params;
    const { participantId } = await searchParams;

    return (
        <>
            <main className='w-screen h-screen bg-black flex items-center justify-center text-white max-lg:flex-col'>
                <div className='w-full max-lg:h-1/2 h-full bg-black flex items-center justify-center p-20 max-lg:px-10 max-lg:pb-10'>
                    <SendFiles />
                </div>
                <div className='w-full max-lg:h-1/2 h-full bg-neutral-800 flex items-center justify-center p-20 max-lg:p-10'>
                    <ReceiveFiles />
                </div>
            </main>
            <ToastContainer />
            <SessionDetailsBanner sessionId={id} participantId={participantId} />
        </>
    );
}
