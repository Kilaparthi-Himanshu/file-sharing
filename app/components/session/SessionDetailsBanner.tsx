'use client';

import { useAtom } from "jotai";
import { sessionDetails } from "@/app/Atoms/atoms";
import { createClient } from "@/app/utils/supabase/client";
import { useEffect } from "react";
import { toast, Slide } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { useSessionDeletionListener } from "@/app/utils/hooks/session/useSessionDeleteListener";

export default function SessionDetailsBanner({ 
    sessionId,
    participantId 
} : { 
    sessionId: string
    participantId: string 
}) {
    useSessionDeletionListener(sessionId);

    const [sessionData, setSessionData] = useAtom(sessionDetails);
    const supabase =  createClient();

    useEffect(() => {
        const fetchUserAndSessionDetails = async () => {
            const { data: userData, error: userDataError } = await supabase
                .from('session_participants')
                .select('display_name')
                .eq('id', participantId)
                .single();

            if (userDataError) return;

            setSessionData({
                displayName: userData.display_name,
                sessionId
            });

            toast.success(`Welcome ${userData.display_name}`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Slide,
                style: {
                    background: 'black',
                    border: '1px solid rgb(50, 50, 50)'
                }
            });
        }

        fetchUserAndSessionDetails();
    }, []);

    return (
        <>
            <AnimatePresence>
                {sessionData.displayName && (
                    <motion.div 
                        className="w-max h-max absolute top-0 min-h-12 z-201"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="border border-neutral-500 relatve w-full h-full p-3 flex m-2 text-white text-[16px] font-normal rounded-xl gap-2 font-inter">
                            <span>Sender: 
                                <span className="text-teal-400"> {sessionData.displayName}</span>
                            </span>
                            <span>Session ID: 
                                <span className="text-amber-400"> {sessionData.sessionId}</span>
                            </span>
                            <div className="absolute right-[-12] top-1">
                                <span className="relative flex size-3">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75`}></span>
                                    <span className={`relative inline-flex size-3 rounded-full bg-green-400`}></span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}