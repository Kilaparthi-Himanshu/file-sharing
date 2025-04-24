'use client'

import { useRef, useState } from "react";
import { FaRegFile } from "react-icons/fa";
import { LuFileStack } from "react-icons/lu";

export default function ReceiveFiles() {
    const filesDemoData = [
        { name: 'HelloWorld.txt', downloaded: true },
        { name: 'Sharp.mp3', downloaded: false },
        { name: 'Scaled.pdf', downloaded: false },
        { name: 'Movie.vid', downloaded: true },
        { name: 'Pandas.png', downloaded: true },
        { name: 'Exam Hallticket.rar', downloaded: false },
        { name: 'Scaled.pdf', downloaded: false },
        { name: 'Movie.vid', downloaded: true },
        { name: 'Pandas.png', downloaded: true },
        { name: 'Exam Hallticket.rar', downloaded: false },
    ]
    const [files, setFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDrop =(event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files) return;
        console.log(files[0]);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        console.log(files[0]);
    }

    return (
        <div className="border border-neutral-500 w-full h-full text-white rounded-xl flex flex-row lg:flex-col p-4 gap-2">
            <div className="border-2 border-neutral-700 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center gap-4"
                onClick={() => fileRef?.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >   
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
                    <LuFileStack className="mb-2" />
                    <span className="text-xl font-normal">Drag and drop a file or click to browse</span>
                    <span className="text-neutral-300 text-lg font-normal">PDF, image, video, or audio</span>
                    <input type="file" multiple hidden ref={fileRef} onChange={handleFileChange}/>
                </div>
            </div>
            <span className="text-lg w-full max-lg:hidden">Files Sent:</span>
            <div className="rounded-xl flex-1 overflow-y-auto">
                <div className="w-full flex gap-2 flex-wrap">
                    {filesDemoData.map((file, index) => (
                        <div key={index} className="border border-neutral-500 text-lg font-normal w-40 p-2 flex flex-col items-center justify-center rounded-xl text-center">
                            <FaRegFile size={25} />
                            {file.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}