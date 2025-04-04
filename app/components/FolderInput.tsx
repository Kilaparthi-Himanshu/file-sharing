'use client';

import { useRef, useState } from "react";
import {  uploadEncryptedFile } from "../functions/encrypt";
import { FileIdDisplay } from "./FileIdDisplay";
import { useMutation } from '@tanstack/react-query';
import { SpinnerRenderer } from "./Spinner";
import { usePasswordEye } from "../utils/hooks/usePasswordEye";
import JSZip from "jszip";
import { FaRegFolder } from "react-icons/fa6";

export const FolderInput = () => {
    const [file, setFile] = useState<File | null>(null);
    const [secretKey, SetSecretKey] = useState<string>('')
    const fileRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');
    const {isHidden, PasswordEye} = usePasswordEye();
    const [uploadingFolder, setUploadingFolder] = useState<boolean>(false);

    const { mutateAsync: addFile, isPending: isUploadPending } = useMutation({
        mutationFn: async (data: { file: File, secretKey: string }) => uploadEncryptedFile(data.file, data.secretKey)
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadingFolder(true);
        const files = event.target.files;
        if (!files || files.length === 0) {
            setErrorMessage("Please Upload a Folder");
            setUploadingFolder(false);
            return;
        }

        let totalSize = 0;
        for (let i = 0; i < files.length; i++)
            totalSize += files[i].size;

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (totalSize > maxSize) {
            setUploadingFolder(false);
            setErrorMessage("Exceeds max size of 50MB");
            return;
        }

        const zip = new JSZip();
        const folderName = files[0].webkitRelativePath.split('/')[0]; // Get the folder name
        const folderZip = zip.folder(folderName); // Create a folder inside ZIP

        for (const file of files) {
            const relativePath = file.webkitRelativePath; // Keep the original structure
            const fileData = await file.arrayBuffer(); // Read file
            folderZip!.file(relativePath.replace(folderName + "/", ""), fileData);
        }

        zip.generateAsync({ type: "blob" }).then(blob => {
            setFile(new File([blob], `${folderName}.zip`, { type: "application/zip" }));
        });
        setUploadingFolder(false);
    };

    const handleUpload = async () => {
        if (!file) {
            setErrorMessage("Please Upload a Folder");
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
            setErrorMessage("Exceeds max size of 50MB");
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

        console.log(fileId);
    }

    return(
        <>
            <div className="w-full" onClick={() => fileRef?.current?.click()}>
                <div className="border-2 border-neutral-600 border-dashed w-full h-80 rounded-lg flex items-center p-2 justify-center text-xl text-center group">
                    <input 
                        type="file" 
                        className="hidden"
                        ref={fileRef} 
                        onChange={handleFileChange} 
                        {...{ webkitdirectory: "true" }} 
                        multiple
                    />
                    {file ? 
                        <span className="">
                            Ready to Upload:<br/>
                            <span className="text-neutral-400">
                                {file.name}
                            </span>
                        </span> : 
                        <div className="flex flex-col items-center">
                            <FaRegFolder size={60} className="text-neutral-300 group-active:scale-90 transition-[scale] mb-[24px]" />
                            Click here to choose a Folder
                        </div>
                    }
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

           {(isUploadPending || uploadingFolder) &&  <SpinnerRenderer />}
        </>
    );
}