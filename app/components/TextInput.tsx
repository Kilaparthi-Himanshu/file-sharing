'use client';

import { useState } from "react";
import { uploadEncryptedText } from "../functions/encryptText";
import { FileIdDisplay } from "./FileIdDisplay";
import { useMutation } from '@tanstack/react-query';
import { SpinnerRenderer } from "./Spinner";
import { usePasswordEye } from "../utils/hooks/usePasswordEye";
import SliderTime from "./SliderTime";
import { lifeTimeAtom } from "../Atoms/atoms";
import { useAtom } from "jotai";

export const TextInput = () => {
    const [text, setText] = useState<string>("");
    const [secretKey, SetSecretKey] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');
    const {isHidden, PasswordEye} = usePasswordEye();
    const [lifeTime, setLifeTime] = useAtom(lifeTimeAtom);

    const { mutateAsync: addText, isPending: isUploadPending } = useMutation({
        mutationFn: async (data: { text: string, secretKey: string, lifeTime: number }) => uploadEncryptedText(data.text, data.secretKey, data.lifeTime)
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

        const { fileId } = await addText({text, secretKey, lifeTime});
        setShowFileIdDisplay(true);
        setFileId(fileId);

        setErrorMessage("Success!");

        setTimeout(() => {
            setErrorMessage("");
        }, 3000);
    }

    return(
        <>
            <div className='border-2 outline-1 outline-neutral-600  border-transparent w-full h-80 rounded-xl flex flex-col items-center gap-6 p-2 focus-within:outline-4 focus-within:outline-neutral-700 focus-within:border-neutral-400 focus-within:border-2 transition-[outline,border] duration-[50ms,0ms] overflow-hidden'>
                <textarea 
                    className="outline-0 resize-none custom-scrollbar w-full h-full p-2"
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter Some Text ....."
                    required
                ></textarea>
            </div>

            <div className="w-full relative mt-8">
                <input type={isHidden ? 'password' : 'text'} className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl ${secretKey ? 'tracking-[8px]' : 'max-lg:text-sm'}  font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} maxLength={5}  placeholder='Enter 5-Digit Secret Key' required onChange={(e) => SetSecretKey(e.target.value)}/>
                <PasswordEye />
            </div>

            <div className="w-full mt-8 items-center justify-center flex flex-col">
                <span className="font-semibold self-start">Life Time of the Text: </span>
                <SliderTime />
            </div>

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