import React from 'react';
import SendFiles from '@/app/components/session/SendFiles';
import ReceiveFiles from '@/app/components/session/ReceiveFiles';
import { ToastContainer } from 'react-toastify';
import SessionDetailsBanner from '@/app/components/session/SessionDetailsBanner';
import UpdateLastActive from '@/app/components/session/updaters/updateLastActive';
import RefreshSessionCookies from '@/app/components/session/updaters/updateCookies';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ participantId: string }>;
}

export default async function Session({ params, searchParams }: Props) {

    const { id } = await params;
    const { participantId } = await searchParams;

    return (
        <>
            <UpdateLastActive sessionId={id} />
            <RefreshSessionCookies sessionId={id} />

            <main className='w-screen h-[100dvh] bg-black flex items-center justify-center text-white max-lg:flex-col'>
                <div className='w-full max-lg:h-1/2 h-full bg-black flex items-center justify-center p-20 max-sm:px-5 max-sm:pb-5 max-lg:px-10 max-lg:pb-10 lg:max-w-1/2'>
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
