'use client';

import { useRef, useState } from "react";
import { CiFileOn, CiImageOn, CiText, CiVideoOn, CiMusicNote1 } from "react-icons/ci";
import { LuFileStack } from "react-icons/lu";

export default function SendFiles() {
    const [sentFiles, setSentFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDrop =(event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files) return;
        console.log(files);
        setSentFiles([...sentFiles, ...Array.from(files)]);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setSentFiles([...sentFiles, ...Array.from(files)]);
    }

    const handleUpload = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        
    }

    return (
        <div className="border border-neutral-500 w-full h-full text-white rounded-xl flex flex-row lg:flex-col p-4 gap-2 max-lg:gap-4">
            <div className="border-2 border-neutral-700 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center gap-4 p-2 relative"
                onClick={() => fileRef?.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
                    <LuFileStack className="mb-2 text-8xl max-lg:text-5xl" />
                    <span className="text-xl font-normal max-sm:text-lg">Drag and drop files or click to browse</span>
                    <span className="text-neutral-300 text-lg font-normal max-sm:text-sm">PDF, image, video, or audio</span>
                    <input type="file" multiple hidden ref={fileRef} onChange={handleFileChange}/>
                </div>

                <button 
                    className="absolute bottom-2 right-2 max-lg:right-1 px-6 py-2 bg-neutral-900 active:bg-neutral-950 transition-[background,scale] active:scale-96 max-lg:active:scale-86 border border-neutral-700 text-lg rounded-xl max-lg:scale-90"
                    onClick={handleUpload}
                >
                    Upload
                </button>
            </div>

            <span className="text-xl w-full max-lg:hidden">Files Sent:</span>

            <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar">
                {sentFiles.length > 0 ? (
                    <div className="w-full flex gap-2 flex-wrap">
                        {sentFiles.map((file, index) => {
                            const type = file.type.split('/')[0];

                            return (
                                <div key={index} className="border border-neutral-500 text-lg font-normal w-30 h-28 p-2 gap-2 flex flex-col items-center justify-center rounded-xl text-center">
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
                                    <span className="line-clamp-filename w-full text-[16px]">{file.name}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-neutral-500 text-4xl font-bold text-center font-inter">No Files Sent Yet</span>
                    </div>
                )}
            </div>
        </div>
    );
}