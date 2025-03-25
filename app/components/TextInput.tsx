'use client';

import { FaRegFile } from "react-icons/fa";
import { useRef, useState } from "react";
import { uploadEncryptedText } from "../functions/encryptText";
import { FileIdDisplay } from "./FileIdDisplay";
import { useMutation } from '@tanstack/react-query';
import { SpinnerRenderer } from "./Spinner";

export const TextInput = () => {
    const [text, setText] = useState<string>("");
    const [secretKey, SetSecretKey] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');

    const { mutateAsync: addText, isPending: isUploadPending } = useMutation({
        mutationFn: async (data: { text: string, secretKey: string }) => uploadEncryptedText(data.text, data.secretKey)
    });

    const handleUpload = async () => {
        const trimmedText = text.trim(); // Trim spaces

        if (!trimmedText) {
            setErrorMessage("Please Enter some Text");
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

        const { fileId } = await addText({text, secretKey});
        setShowFileIdDisplay(true);
        setFileId(fileId);

        setErrorMessage("Success!");

        setTimeout(() => {
            setErrorMessage("");
        }, 3000);

        console.log(fileId);
    }

    return(
        <>
            <div className='border border-neutral-600 w-full h-80 rounded-xl flex flex-col items-center gap-6 p-2 group focus:border-neutral-300 overflow-hidden'>
                <textarea 
                    className="outline-0 resize-none custom-scrollbar w-full h-full p-2"
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter Some Text ....."
                    required
                ></textarea>
            </div>

            <input type='text' className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 mt-8 text-center text-xl ${secretKey && 'tracking-[8px]'}  font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-50`} maxLength={5}  placeholder='Enter 5-Digit Secret Key' required onChange={(e) => SetSecretKey(e.target.value)}/>

            <div className="w-full flex items-center mt-8 justify-between">
                <button className="w-40 h-12 self-start border border-neutral-600 rounded-lg bg-neutral-800 hover:bg-neutral-900 transition-[background,scale] cursor-pointer active:scale-98" onClick={handleUpload}>
                    Upload
                </button>

                <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-2`}>{errorMessage}</span>
            </div>

            {showFileIdDisplay && (
                <FileIdDisplay fileId={fileId} />
            )}

           {isUploadPending &&  <SpinnerRenderer />}
        </>
    );
}