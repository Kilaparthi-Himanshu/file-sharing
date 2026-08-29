import React, { useState } from 'react'
import ShinyText from '../misc/ShinyText';

export default function InstanReceive() {
    const [transferId, setTransferId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleReceive = () => {
        if (!transferId) {
            setErrorMessage("Please Enter an ID");
            return;
        }

        setErrorMessage("");

        // Supabase signaling + WebRTC connection
        // will be implemented here.
    };

    return (
        <div className="flex flex-col gap-8 items-center justify-between w-full h-full">
            <span className="text-4xl font-bold">RECEIVE</span>

            <div className="w-full h-full bg-purple-900/20 rounded-xl relative">
                <div className="w-full h-full flex items-center justify-center">
                    <ShinyText text="Waiting..." disabled={false} speed={3} className="text-2xl font-bold" />
                </div>
            </div>

            <div className="w-full relative">
                <input type='text' value={transferId} onChange={(e) => setTransferId(e.target.value)} className={`border border-purple-500 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl ${transferId ? 'tracking-[8px]' : 'max-lg:text-sm'}  font-sans focus:outline-4 outline-purple-700 focus:border-purple-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} maxLength={6} placeholder='Enter ID' required />
            </div>

            <div className="w-full flex items-center justify-between">
                <button className="w-40 h-12 self-start border border-purple-600 rounded-lg bg-purple-700 hover:bg-purple-800 transition-[background,scale] cursor-pointer active:scale-98" onClick={handleReceive}>
                    Receive
                </button>

                <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-2`}>{errorMessage}</span>
            </div>
        </div>
    );
}
