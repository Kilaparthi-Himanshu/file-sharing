import React from 'react';
import SendFiles from '@/app/components/session/SendFiles';
import ReceiveFiles from '@/app/components/session/ReceiveFiles';
import { ToastContainer } from 'react-toastify';
import SessionDetailsBanner from '@/app/components/session/SessionDetailsBanner';

type Props = {
    params: { id: string };
    searchParams: { participantId: string }
}

export default async function Session(props: Props) {
    const { params, searchParams } = props;

    const id = params.id;
    const participantId = searchParams.participantId;

    return (
        <>
            <main className='w-[100dvw] h-[100dvh] bg-black flex items-center justify-center text-white font-bold text-8xl'>
                <div className='w-[100dvw] h-[100dvh] bg-black flex items-center justify-center'>
                    <SendFiles />
                </div>
                <div className='w-[100dvw] h-[100dvh] bg-neutral-800 flex items-center justify-center'>
                    <ReceiveFiles />
                </div>
            </main>
            <ToastContainer />
            <SessionDetailsBanner sessionId={id} participantId={participantId} />
        </>
    );
}
