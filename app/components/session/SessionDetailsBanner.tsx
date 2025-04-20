'use client';

import { useAtom } from "jotai";
import { sessionDetails } from "@/app/Atoms/atoms";
import { createClient } from "@/app/utils/supabase/client";
import { useEffect } from "react";
import { toast, Zoom } from "react-toastify";

export default function SessionDetailsBanner({ 
    sessionId,
    participantId 
} : { 
    sessionId: string
    participantId: string 
}) {
    const [sessionData, setSessionData] = useAtom(sessionDetails);
    const supabase =  createClient();

    const fetcUserDetails = async () => {
        const { data, error } = await supabase
            .from('session_participants')
            .select('display_name')
            .eq('id', participantId)
            .single();

        if (error) return;

        setSessionData({
            displayName: data.display_name,
            sessionId
        });

        toast.success(`Welcome ${data.display_name}`, {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Zoom,
            style: {
                background: 'black',
                border: '1px solid rgb(50, 50, 50)'
            }
        });
    }

    useEffect(() => {
        fetcUserDetails();
    }, []);

    return (
        <div className="border border-neutral-500 w-max h-max p-3 flex flex-col absolute top-0 m-2 text-white text-[16px] font-normal rounded-xl gap-2 font-inter ">
            <span>Sender: 
                <span className="text-teal-400"> {sessionData.displayName}</span>
            </span>
            <span>Session ID: 
                <span className="text-amber-400"> {sessionData.sessionId}</span>
            </span>
        </div>
    );
}