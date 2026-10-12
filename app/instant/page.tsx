'use client';

import { useRef, useState } from "react";
import { FileIdDisplay } from "../components/FileIdDisplay";
import InstantSend from "../components/Instant/InstantSend";
import InstantReceive from "../components/Instant/InstantReceive";
import DebugMenu from "../components/Instant/Debug/DebugMenu";

const Instant = () => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');

    return(
        <div className='bg-black max-lg:min-h-[100dvh] max-lg:h-max lg:h-[100dvh] w-screen flex flex-col gap-15 items-center justify-center p-4 text-white noise-texture pointer-coarse:max-lg:py-20'>
            <div className='border-2 border-purple-700 h-full w-full max-lg:max-w-[580px] lg:w-280 lg:h-200 rounded-xl flex max-lg:flex-col gap-8 items-center px-8 py-8 bg-neutral-950 to-blue-950'>
                <InstantSend />

                <div className="max-lg:w-full max-lg:h-[4px] lg:h-full lg:w-[4px] bg-linear-to-b from-purple-500 to-blue-500 rounded-full" />

                <InstantReceive />

                {showFileIdDisplay && (
                    <FileIdDisplay fileId={fileId} />
                )}

                <DebugMenu />
            </div>
        </div>
    );
}

export default Instant;
