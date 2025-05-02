'use client'

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiFileOn, CiImageOn, CiText, CiVideoOn, CiMusicNote1 } from "react-icons/ci";
import { createClient } from "@/app/utils/supabase/client";
import { decryptFiles } from "@/app/functions/session/encryptAndDecryptFiles";
import { useAtom } from "jotai";
import { sessionPassword } from "@/app/Atoms/atoms";
import { assertNotNull } from "@/app/functions/assertNotNull";
import { DecryptedFile } from "@/app/functions/session/encryptAndDecryptFiles";
import { formatTime } from "./SendFiles";
import ShinyText from "../misc/ShinyText";
import { IoMdDownload } from "react-icons/io";
import { useSessionFileReceiveListener } from "@/app/utils/hooks/session/useSessionFileReceiveListener";

type FileInfo = {
    name: string;
    type: string;
    addedAt: string;
    index?: number
    filesType: 'received' | 'downloaded'
    click?: () => void
}

type DecryptedFileWithTime = DecryptedFile & {
    addedAt: string;
}

export default function ReceiveFiles({ sessionId, participantId }: { sessionId: string, participantId: string }) {
    const [currentSessionPassword, setCurrentSessionPassword] = useAtom(sessionPassword);
    const password = assertNotNull(currentSessionPassword, 'Missing Session Password');
    const [receivedFiles, setReceivedFiles] = useState<DecryptedFileWithTime[]>([]);
    const [downloadedFiles, setDownloadedFiles] = useState<DecryptedFileWithTime[]>([]);
    const supabase = createClient();

    const handleFileReceive = async (file_path: string) => {
        const { data: fileData, error: fileError } = await supabase
            .storage
            .from('sessions-data')
            .download(`${file_path}?nocache=${Date.now()}`)

        if (!fileData || fileError) return;

        const decryptedFile = await decryptFiles(fileData, password);
        const formatedDate = formatTime(new Date());

        setReceivedFiles(prevFiles => [
            ...prevFiles, 
            { blob: decryptedFile!.blob, fileName: decryptedFile!.fileName, addedAt: formatedDate }
        ]);
    }

    useSessionFileReceiveListener(sessionId, participantId,  handleFileReceive);

    const handleDownload = (file: DecryptedFileWithTime) => {
        setReceivedFiles(prevFiles => prevFiles.filter(prevFile => prevFile != file));

        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadedFiles(prevFiles => [...prevFiles, file]);
    }

    const handleReDownload = (file: DecryptedFileWithTime) => {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="border border-neutral-500 w-full h-full text-white rounded-xl flex flex-row lg:flex-col p-4 gap-2 bg-black">
            <span className="text-lg w-full max-lg:hidden">Files Received:</span>

            <div className="flex flex-col overflow-y-auto flex-1/2">
                <span className="text-lg w-full lg:hidden">Files Received:</span>
                <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                    {receivedFiles.length > 0 ? (
                        <div className="w-full flex gap-2 flex-wrap">
                            {receivedFiles.map((file, index) => {
                                const type = file.fileName.split('/')[0];

                                return (
                                    <FileItem key={index} name={file.fileName} type={type} index={index} addedAt={file.addedAt} filesType={'received'} click={() => handleDownload(file)} />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShinyText text="No Files Have Received Sent Yet" disabled={false} speed={3} className="text-3xl font-bold" />
                        </div>
                    )}
                </div>
            </div>

            <span className="text-lg w-full max-lg:hidden">Files Downloaded:</span>

            <div className="flex flex-col overflow-y-auto flex-1/2">
                <span className="text-lg w-full lg:hidden">Files Downloaded:</span>
                <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                    {downloadedFiles.length > 0 ? (
                        <div className="w-full flex gap-2 flex-wrap">
                            {downloadedFiles.map((file, index) => {
                                const type = file.fileName.split('/')[0];

                                return (
                                    <FileItem key={index} name={file.fileName} type={type} index={index} addedAt={file.addedAt} filesType={'downloaded'} click={() => handleReDownload(file)} />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShinyText text="No Files Have Downloaded Sent Yet" disabled={false} speed={3} className="text-3xl font-bold" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const FileItem = ({ name, type, addedAt, index, filesType, click }: FileInfo) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div 
            key={index}
            className="border border-neutral-500 text-lg font-normal w-30 h-28 p-2 gap-2 flex flex-col items-center justify-center rounded-xl text-center relative overflow-hidden max-sm:h-14 max-sm:w-35 pointer-fine:max-sm:w-44 max-sm:flex-row"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={click}
        >
            {
                type === 'image' ? (
                    <CiImageOn size={30} />
                ) : type === 'text' ? (
                    <CiText size={30} />
                ) : type === 'audio' ? (
                    <CiMusicNote1 size={30} />
                ) : type === 'video' ? (
                    <CiVideoOn size={30} />
                ) : (
                    <CiFileOn size={30} />
                )
            }
            <span className="line-clamp-filename w-full text-[16px]">{name}</span>
            <AnimatePresence mode="wait">
                {isHovered && (
                    filesType === 'received' ? (
                        <motion.div 
                            className="flex flex-col items-center justify-center w-full h-full absolute bg-neutral-700/20 backdrop-blur-sm font-sans rounded-xl max-sm:text-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            key="dragging-overlay"
                        >
                            <IoMdDownload size={40} />
                            <span>Download</span>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="flex flex-col items-center justify-center w-full h-full absolute bg-neutral-700/20 backdrop-blur-sm font-sans rounded-xl text-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            key="dragging-overlay"
                        >
                            <span>Sent At:</span>
                            <span>{addedAt}</span>
                            <IoMdDownload size={40} />
                            <span>Download Again</span>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </motion.div>
    );
}