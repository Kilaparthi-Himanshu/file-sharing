'use client';

import { FaRegFile } from "react-icons/fa";
import { useRef, useState } from "react";
import { uploadEncryptedFile } from "../functions/encrypt";
import { FileIdDisplay } from "../components/FileIdDisplay";
import { useMutation } from '@tanstack/react-query';
import { SpinnerRenderer } from "../components/Spinner";
import { usePasswordEye } from "../utils/hooks/usePasswordEye";
import SliderTime from "../components/SliderTime";
import { lifeTimeAtom } from "../Atoms/atoms";
import { useAtom } from "jotai";
import ShinyText from "../components/misc/ShinyText";
import InstantSend from "../components/Instant/InstantSend";
import InstanReceive from "../components/Instant/InstantReceive";

const Instant = () => {
    const [file, setFile] = useState<File | null>(null);
    const [secretKey, SetSecretKey] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showFileIdDisplay, setShowFileIdDisplay] = useState<boolean>(false);
    const [fileId, setFileId] = useState<string>('');
    const {isHidden, PasswordEye} = usePasswordEye();
    const [lifeTime, setLifeTime] = useAtom(lifeTimeAtom);

    const { mutateAsync: addFile, isPending: isUploadPending } = useMutation({
        mutationFn: async (data: { file: File, secretKey: string, lifeTime: number }) => uploadEncryptedFile(data.file, data.secretKey, data.lifeTime)
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

        const { fileId } = await addFile({file, secretKey, lifeTime});
        setShowFileIdDisplay(true);
        setFileId(fileId);

        setErrorMessage("Success!");

        setTimeout(() => {
            setErrorMessage("");
        }, 3000);
    }

    return(
        <div className='bg-black h-[100dvh] w-screen flex flex-col gap-15 items-center justify-center p-4 text-white overflow-hidden noise-texture'>
            <div className='border-2 border-purple-700 w-280 h-200 rounded-xl flex gap-8 items-center px-8 py-8 bg-purple-950 to-blue-950'>
                <InstantSend />

                <div className="h-full w-[4px] bg-linear-to-b from-purple-500 to-blue-500 rounded-full" />

                <InstanReceive />

                {showFileIdDisplay && (
                    <FileIdDisplay fileId={fileId} />
                )}

                {isUploadPending &&  <SpinnerRenderer />}
            </div>
        </div>
    );
}

export default Instant;
