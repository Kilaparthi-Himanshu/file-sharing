'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { profileAtom, userAtom } from '../Atoms/atoms';

export default function Dashboard () {
    const profile = useAtomValue(profileAtom);

    if (!profile) {
        return (
            <div>
                GG
            </div>
        );
    } //TODO: Temporary loader (later replace with skeletons in code).

    return (
        <div>
            {profile.full_name}
        </div>
    );
}
