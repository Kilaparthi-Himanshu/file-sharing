'use client';

import { useState } from "react";
import { downloadDecryptedFile } from "../functions/decrypt";
import { useMutation } from "@tanstack/react-query";
import { SpinnerRenderer } from "./Spinner";

export const FileDownload = () => {
    const [secretKey, SetSecretKey] = useState<string>('')
    const [fileId, setFileId] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>("");

    const { mutateAsync: getFile, isPending: isDownloadPending } = useMutation({
        mutationFn: async (data: { fileId: string, secretKey: string }) => downloadDecryptedFile(data.fileId, data.secretKey)
    });

    const handleDownload = async () => {

        if (!fileId) {
            setErrorMessage("Please Enter a File ID");
            return;
        }

        if (fileId.length != 6) {
            setErrorMessage("File ID Key must be 6 digits");
            return;
        }

        if (!secretKey) {
            setErrorMessage("Please Enter a Secret Key");
            return;
        }

        if (secretKey.length != 5) {
            setErrorMessage("Secret Key must be 5 digits");
            return;
        }

        setErrorMessage("");

        const message = await getFile({fileId, secretKey});

        setErrorMessage(message);

        setTimeout(() => {
            setErrorMessage("");
        }, 5000);
    }

    return(
        <>
            <input type='text' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 mt-8 text-center text-xl ${fileId && 'tracking-[8px]'}  font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-50`} maxLength={6}  placeholder='Enter File ID' required onChange={(e) => setFileId(e.target.value)}/>

            <input type='text' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 mt-8 text-center text-xl ${secretKey && 'tracking-[8px]'}  font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-50`} maxLength={5}  placeholder='Enter 5-Digit Secret Key' required onChange={(e) => SetSecretKey(e.target.value)}/>

            <div className="w-full flex items-center mt-8 justify-between">
                <button className="w-40 h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] cursor-pointer active:scale-98" onClick={handleDownload}>
                    Download
                </button>

                <span className={`text-lg ${errorMessage === 'Success!' ? 'text-green-400' : 'text-red-400'} ml-2`}>{errorMessage}</span>
            </div>

            {isDownloadPending &&  <SpinnerRenderer />}
        </>
    );
}