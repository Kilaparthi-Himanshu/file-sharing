'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { CiFileOn, CiImageOn, CiText, CiVideoOn, CiMusicNote1 } from "react-icons/ci";
import { LuFileStack } from "react-icons/lu";
import { FaRegTrashCan } from "react-icons/fa6";
import { toast, Bounce } from "react-toastify";
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Spinner } from "../Spinner";

type SenderFiles = {
    file: File;
    addedAt: string;
}

type FileInfo = {
    name: string;
    type: string;
    addedAt: string;
    index?: number
}

export default function SendFiles() {
    const [pendingFiles, setPendingFiles] = useState<SenderFiles[]>([]);
    const [sentFiles, setSentFiles] = useState<FileInfo[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [parent] = useAutoAnimate({
        duration: 200,
        easing: 'ease-in-out',
    });
    const notifyError = (message: string) => toast.error(message, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
        style: {
            background: 'black',
            border: '1px solid rgb(28, 28, 28)',
            width: '300px',
            textAlign: 'center'
        }
    });
    const notifySuccess = (message: string) => toast.success(message, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
        style: {
            background: 'black',
            border: '1px solid rgb(28, 28, 28)'
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    // This will be replaced from isPending from tanstack query

    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    const handleDrop =(event: React.DragEvent<HTMLDivElement>) => {
        setIsDragging(false);
        event.preventDefault();
        const files = event.dataTransfer.files;

        if (!files) return;

        handleFiles(files);
        // No spreading ...file to preserve the full File object reference
        // creating new object in format 
        // {file: File, addedAt: Fri Apr 25 2025 10:56:58 GMT+0530 (India Standard Time)}
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files) return;

        handleFiles(files);

        // Reset input value so selecting same file again triggers change event
        event.target.value = '';
    }

    const handleFiles = (files: FileList) => {
        const formatedDate = formatTime(new Date());
        const filesWithTime = [...Array.from(files)].map(file => ({file, addedAt: formatedDate}));
        setPendingFiles(prevFiles => [...prevFiles, ...filesWithTime]);
    }

    const handleDelete = (event: React.MouseEvent, index: number) => {
        event.preventDefault();
        event.stopPropagation();
        setPendingFiles(prevFiles => prevFiles.filter((_, fileIndex) => fileIndex != index));
    }

    const handleUpload = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        if (pendingFiles.length === 0) return;

        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        for (const file of pendingFiles) {
            if (file.file.size > MAX_SIZE) {
                notifyError('A File or more exceed 50MB, please remove them !');
                return;
            }
        }

        setIsLoading(true);
        await new Promise<void>(resolve => {
            setTimeout(() => {
                setIsLoading(false);
                resolve();
            }, 3000);
        }); // to be removed when tanstack query support is added

        setSentFiles(prevFiles => [...prevFiles, 
            ...pendingFiles.map(file => ({ 
                name: file.file.name, type: file.file.type, addedAt: file.addedAt 
            }))
        ]);
        setPendingFiles([]);
        notifySuccess('Successfully Uploaded the File(s) !');
    }

    return (
        <div className="border border-neutral-500 w-full h-full text-white rounded-xl flex flex-row lg:flex-col p-4 gap-2 max-lg:gap-4 relative">
            <div className="border-2 border-neutral-700 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center gap-4 p-2 relative max-lg:max-w-1/2 lg:max-h-1/2"
                onClick={() => fileRef?.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={(e) => {
                    // Check if leaving towards outside the div
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setIsDragging(false);
                    }
                }}
                onDrop={handleDrop}
            >
                <AnimatePresence mode="wait">
                    {!isDragging ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center gap-4 max-sm:gap-0 pointer-coarse:max-sm:justify-start text-center group ${pendingFiles.length !== 0 && 'justify-start'}`}>
                            <input type="file" multiple hidden ref={fileRef} onChange={handleFileChange}/>
                            {pendingFiles.length === 0 ? (
                                <>
                                    <LuFileStack className="mb-2 text-8xl max-lg:text-5xl max-sm:mb-0 group-active:scale-90 transition-[scale]" />
                                    <span className="text-xl max-sm:text-sm font-normal max-sm:hidden">Drag and drop files or click to browse</span>
                                    <span className="text-xl max-sm:text-sm font-normal sm:hidden">Click to Add Files</span>
                                    <span className="text-neutral-300 text-lg font-normal max-sm:text-sm">PDF, image, video, or audio</span>
                                </>
                            ) : (
                                <div className="w-full overflow-y-auto pointer-coarse:max-sm:h-30 max-sm:h-50 custom-scrollbar">
                                    <div ref={parent} className="flex flex-col gap-2 overflow-hidden max-w-full">
                                        {pendingFiles.map((file, index) => (
                                            <div
                                                key={file.file.name + file.addedAt} // better unique key  
                                                className={`w-full py-2 text-ellipsis truncate flex gap-2 border border-neutral-800 ${file.file.size > 50 * 1024 * 1024 && 'border-red-500 bg-red-400/20'} rounded-xl px-2`} 
                                                title={file.file.size > 50 * 1024 * 1024 ? 'Exceeds 50MB' : ''}
                                            >
                                                <div className="w-full overflow-x-hidden flex">
                                                    <span className="text-start w-full">
                                                        <span className="font-bold">{index + 1}. </span>
                                                        {file.file.name}
                                                    </span>
                                                </div>

                                                <div className="right-0 top-1 p-1 rounded" onClick={(event) => handleDelete(event, index)}>
                                                    <FaRegTrashCan className="text-[#e22a33] text-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div 
                            className="w-full h-full backdrop-blur-lg flex items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900/20 via-neutral-700/40 to-neutral-900/20 text-2xl font-inter font-bold"
                            key="dragging-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            Drop Here
                        </motion.div>
                    )}
                </AnimatePresence>

                {pendingFiles.length > 0 && (
                    <div className={`sm:absolute bottom-2 right-2 flex flex-row gap-1 lg:gap-2 ${pendingFiles.length > 0 && 'right-14'}`}>
                            <button 
                                className={`px-6 py-2 bg-neutral-900 active:bg-neutral-950 transition-[background,scale] active:scale-96 border border-neutral-700 text-lg rounded-xl ${pendingFiles.length > 0 && 'max-sm:px-3 max-sm:py-1'}`}
                                onClick={handleUpload}
                            >
                                Send
                            </button>

                            <button 
                                className="px-6 py-2 bg-neutral-900 active:bg-neutral-950 transition-[background,scale] active:scale-96 border border-neutral-700 text-lg rounded-xl max-sm:px-3 max-sm:py-1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                Add
                            </button>
                    </div>
                )}
            </div>

            <span className="text-xl w-full max-lg:hidden">Files Sent:</span>

            <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                {sentFiles.length > 0 ? (
                    <div className="w-full flex gap-2 flex-wrap">
                        {sentFiles.map((file, index) => {
                            const type = file.type.split('/')[0];

                            return (
                                <FileItem key={index} name={file.name} type={type} index={index} addedAt={file.addedAt} />
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-neutral-500 text-4xl max-sm:text-2xl font-bold text-center font-inter">No Files Have Been Sent Yet</span>
                    </div>
                )}
            </div>

            {isLoading && <Spinner />}
        </div>
    );
}

const FileItem = ({ name, type, addedAt, index }: FileInfo) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div key={index}
            className="border border-neutral-500 text-lg font-normal w-30 h-28 p-2 gap-2 flex flex-col items-center justify-center rounded-xl text-center relative overflow-hidden max-sm:h-14 max-sm:w-35 pointer-fine:max-sm:w-44 max-sm:flex-row"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
                    <motion.div 
                        className="flex flex-col items-center justify-center w-full h-full absolute bg-neutral-700/20 backdrop-blur-sm font-sans rounded-xl max-sm:text-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        key="dragging-overlay"
                    >
                        <span>Sent At:</span>
                        <span>{addedAt}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}