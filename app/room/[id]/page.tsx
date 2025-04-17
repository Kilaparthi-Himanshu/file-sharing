import React from 'react';
import { notFound } from 'next/navigation';

export default async function Room({params}: {params: Promise<{id: string}>}) {
    const id = (await params).id;
    const validIds = [
        '123456', '654321'
    ]

    if (!validIds.includes(id)) {
        return (
            <div>
                Room Not Found
            </div>
        );
    }
    // In future we attain the data by using supabase.eq to check if requested id is present in db and if the provided db password is valid

    return (
        <main className='w-[100dvw] h-[100dvh] bg-black flex items-center justify-center text-white font-bold text-8xl'>
            Room {id}
        </main>
    );
}
