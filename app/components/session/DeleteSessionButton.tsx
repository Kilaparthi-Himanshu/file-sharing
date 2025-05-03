'use client';

import React, { useState } from 'react';
import { DeleteSessionModalRenderer } from './DeleteSessionModalRenderer';
import { useSessionDeletionListener } from '@/app/utils/hooks/session/useSessionDeleteListener';

export const DeleteSessionButton = ({ 
    sessionId, 
    children, 
    buttonRef 
}: { 
    sessionId: string, 
    children: React.ReactNode, 
    buttonRef?: React.RefObject<HTMLDivElement>; 
}) => {
    useSessionDeletionListener(sessionId);
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = async () => {
        setIsOpen(true);
    }

    return (
        <>
            <div onClick={handleDelete} ref={buttonRef}>
                {children}
            </div>
            <DeleteSessionModalRenderer isOpen={isOpen} setIsOpen={setIsOpen} sessionId={sessionId} />
        </>
    );
}
