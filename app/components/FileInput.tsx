'use client';

import { FaRegFile } from "react-icons/fa";
import { useRef, useState } from "react";
import { uploadEncryptedFile } from "../functions/encrypt";
import { FileIdDisplay } from "./FileIdDisplay";
import { useMutation } from '@tanstack/react-query';
import { SpinnerRenderer } from "./Spinner";
import { usePasswordEye } from "../utils/hooks/usePasswordEye";

export const FileInput = () => {
    const [file, setFile] = useState<File | null>(null);
    const [secretKey, SetSecretKey] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');
    const {isHidden, PasswordEye} = usePasswordEye();

    const { mutateAsync: addFile, isPending: isUploadPending } = useMutation({
        mutationFn: async (data: { file: File, secretKey: string }) => uploadEncryptedFile(data.file, data.secretKey)
    });

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files && files[0]) {
            setFile(files[0]);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            setFile(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setErrorMessage("Please Upload a File");
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

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            setErrorMessage("Exceeds max file size of 50MB");
            return;
        }

        setErrorMessage("");

        const { fileId } = await addFile({file, secretKey});
        setShowFileIdDisplay(true);
        setFileId(fileId);

        setErrorMessage("Success!");

        setTimeout(() => {
            setErrorMessage("");
        }, 3000);
    }

    return(
        <>
            <div className='border-2 border-dashed border-neutral-600 w-full h-60 rounded-xl flex flex-col items-center gap-6 p-4 pt-10 group'
                onClick={() => fileRef?.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <FaRegFile size={60} className="text-neutral-300 group-active:scale-90 transition-[scale]" />
                <span className="text-xl text-center">Drag and drop a file or click to browse</span>
                <span className="text-neutral-300">PDF, image, video, or audio</span>
            </div>

            <div className="w-full mt-8" onClick={() => fileRef?.current?.click()}>
                <div className="border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2">
                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileRef} 
                        onChange={handleFileChange} 
                    />
                    {file ? file.name : "Choose File: No file chosen"}
                </div>
            </div>

            <div className="w-full relative mt-8">
                <input type={isHidden ? 'password' : 'text'} className={`border border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl ${secretKey ? 'tracking-[8px]' : 'max-lg:text-sm'}  font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} maxLength={5}  placeholder='Enter 5-Digit Secret Key' required onChange={(e) => SetSecretKey(e.target.value)}/>
                <PasswordEye />
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