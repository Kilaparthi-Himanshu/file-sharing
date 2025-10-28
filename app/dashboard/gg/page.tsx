'use client';

import { profileAtom } from '@/app/Atoms/atoms';
import { useAtomValue } from 'jotai';
import React from 'react';

export default function GG () {
    const profile = useAtomValue(profileAtom);

    if (!profile) {
        return (
            <div>
                GG
            </div>
        );
    }

    return (
        <div>{profile.full_name} GG</div>
    );
}
