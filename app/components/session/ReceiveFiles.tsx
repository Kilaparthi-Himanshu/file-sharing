'use client'

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiFileOn, CiImageOn, CiText, CiVideoOn, CiMusicNote1 } from "react-icons/ci";

type FileInfo = {
    name: string;
    type: string;
    addedAt: string;
    index?: number
}

export default function ReceiveFiles() {
    const filesDemoData = [
        { name: 'HelloWorld.txt', downloaded: true, type: 'file', addedAt: '12-2-25' },
        { name: 'Sharp.mp3', downloaded: false, type: 'file', addedAt: '12-2-25' },
        { name: 'Scaled.pdf', downloaded: false, type: 'file', addedAt: '12-2-25' },
        { name: 'Movie.vid', downloaded: true, type: 'file', addedAt: '12-2-25' },
        { name: 'Pandas.png', downloaded: true, type: 'file', addedAt: '12-2-25' },
        { name: 'Exam Hallticket.rar', downloaded: false, type: 'file', addedAt: '12-2-25' },
        { name: 'Scaled.pdf', downloaded: false, type: 'file', addedAt: '12-2-25' },
        { name: 'Movie.vid', downloaded: true, type: 'file', addedAt: '12-2-25' },
        { name: 'Pandas.png', downloaded: true, type: 'file', addedAt: '12-2-25' },
        { name: 'Exam Hallticket.rar', downloaded: false, type: 'file', addedAt: '12-2-25' }
    ]
    const [receivedFiles, setReceivedFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div className="border border-neutral-500 w-full h-full text-white rounded-xl flex flex-row lg:flex-col p-4 gap-2">
            <span className="text-lg w-full max-lg:hidden">Files Received:</span>

            <div className="flex flex-col overflow-y-auto">
                <span className="text-lg w-full lg:hidden">Files Downloaded:</span>
                <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                    {filesDemoData.length > 0 ? (
                        <div className="w-full flex gap-2 flex-wrap">
                            {filesDemoData.map((file, index) => {
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
            </div>

            <span className="text-lg w-full max-lg:hidden">Files Downloaded:</span>

            <div className="flex flex-col overflow-y-auto">
                <span className="text-lg w-full lg:hidden">Files Downloaded:</span>
                <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                    {filesDemoData.length > 0 ? (
                        <div className="w-full flex gap-2 flex-wrap">
                            {filesDemoData.map((file, index) => {
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
            </div>
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