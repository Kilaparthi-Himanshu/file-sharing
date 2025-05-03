import React from 'react';
import SendFiles from '@/app/components/session/SendFiles';
import ReceiveFiles from '@/app/components/session/ReceiveFiles';
import { ToastContainer } from 'react-toastify';
import SessionDetailsBanner from '@/app/components/session/SessionDetailsBanner';
import UpdateLastActive from '@/app/components/session/updaters/updateLastActive';
import RefreshSessionCookies from '@/app/components/session/updaters/updateCookies';
import { DeleteSessionButton } from '@/app/components/session/DeleteSessionButton';
import { ReEnterPasswordWrapper } from '@/app/components/session/ReEnterPassword';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ participantId: string }>;
}

export default async function Session({ params, searchParams }: Props) {

    const { id } = await params;
    const { participantId } = await searchParams;

    return (
        <ReEnterPasswordWrapper sessionId={id}>
            <>
                <UpdateLastActive sessionId={id} />
                <RefreshSessionCookies sessionId={id} />

                <main className='w-screen h-[100dvh] bg-black flex items-center justify-center text-white max-lg:flex-col noise-texture'>
                    <div className='w-full max-lg:h-1/2 h-full flex items-center justify-center p-20 max-sm:px-5 max-sm:pb-5 max-lg:px-10 max-lg:pb-10 lg:max-w-1/2'>
                        <SendFiles sessionId={id} />
                    </div>
                    <div className='w-full max-lg:h-1/2 h-full flex items-center justify-center p-20 max-sm:px-5 max-sm:pb-5 max-lg:px-10 max-lg:pb-10 lg:max-w-1/2'>
                        <ReceiveFiles sessionId={id} participantId={participantId} />
                    </div>
                </main>
                <ToastContainer />
                <SessionDetailsBanner sessionId={id} participantId={participantId} />
                <DeleteSessionButton sessionId={id}>
                    <button 
                        className='absolute top-2 right-2 bg-red-900 rounded-lg border border-red-500 px-4 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background]'
                    >
                        Delete Session
                    </button>
                </DeleteSessionButton>
            </>
        </ReEnterPasswordWrapper>
    );
}
