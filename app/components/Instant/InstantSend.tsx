import React, { useRef, useState } from 'react';
import { FaRegFile } from 'react-icons/fa6';
import { InstantSession } from '@/lib/instant/InstantSession';

export default function InstantSend() {
    const [files, setFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const sessionRef = useRef<InstantSession | null>(null);
    const [transferId, setTransferId] = useState<string>("");
    const [connectedPeers, setConnectedPeers] = useState(0);

     const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        const droppedFiles = event.dataTransfer.files;

        if (!droppedFiles || droppedFiles.length === 0) {
            return;
        }

        setFiles(Array.from(droppedFiles));
        setErrorMessage("");
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;

        if (!selectedFiles || selectedFiles.length === 0) {
            return;
        }

        setFiles(Array.from(selectedFiles));
         setErrorMessage("");

        // Allows selecting the exact same files again later.
        event.target.value = "";
    };

    const handleSend = async () => {
        if (files.length === 0) {
            setErrorMessage("Please Select a File");
            return;
        }

        try {
            setErrorMessage("");

            const session = new InstantSession(
                "sender",
                {
                    onSessionCreated: (id) => {
                        setTransferId(id);
                    },
                    onPeerConnected: (_peerId, count) => {
                        setConnectedPeers(count);
                    },
                    onPeerDisconnected: (_peerId, count) => {
                        setConnectedPeers(count);
                    },
                    onSendProgress: (_peerId, progress) => {
                        console.log(
                            "Sending:",
                            progress.fileId,
                            progress.progress
                        );
                    },
                    onFileSent: (_peerId, fileId) => {
                        console.log(
                            "File sent:",
                            fileId
                        );
                    },
                    onError: (error) => {
                        setErrorMessage(error.message);
                    },
                }
            );

            sessionRef.current = session;

            await session.create(files);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to create session"
            );
        }
    }

    return (
        <div className="flex flex-col gap-8 items-center flex-1 min-w-0 h-full min-h-0">
            <span className="text-4xl font-bold">SEND</span>

            <div className='border-2 border-dashed border-purple-500 w-full min-h-56 flex-1 rounded-xl flex flex-col items-center justify-center gap-6 p-4 pt-10 group'
                onClick={() => fileRef?.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <FaRegFile size={60} className="text-white group-active:scale-90 transition-[scale]" />
                <span className="text-xl text-center">Drag and drop a file or click to browse</span>
                <span className="text-white">PDF, image, video, or audio</span>
            </div>

            <div className="w-full h-max min-h-12" onClick={() => fileRef?.current?.click()}>
                <div className="border border-purple-500 w-full h-full rounded-lg flex items-center p-2 overflow-hidden">
                    <input 
                        type="file"
                        multiple
                        className="hidden" 
                        ref={fileRef} 
                        onChange={handleFileChange} 
                    />

                    {files.length > 0 ? (
                        <div className="w-full h-full min-h-0 overflow-y-auto border border-purple-500 rounded-lg p-2 custom-scrollbar">
                            <div className="flex flex-col gap-2">
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.name}-${file.lastModified}-${index}`}
                                        className="text-sm truncate"
                                    >
                                        <span className='font-bold text-blue-400'>{index + 1}.</span> {file.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <span>Choose A File/Files.</span>
                    )}
                </div>
            </div>

            {transferId && (
                <div className="w-full border border-purple-500 rounded-lg p-4 text-center shrink-0">
                    <div className="text-sm text-purple-300">
                        Share this ID
                    </div>

                    <div className="text-3xl font-bold tracking-[8px] -mr-[8px]">
                        {transferId}
                    </div>

                    <div className="text-sm text-neutral-300 mt-2">
                        Receivers connected: {connectedPeers}
                    </div>
                </div>
            )}

            <div className="w-full flex items-center justify-between shrink-0">
                <button className="w-40 h-12 self-start border border-purple-600 rounded-lg bg-purple-700 hover:bg-purple-800 transition-[background,scale] cursor-pointer active:scale-98" onClick={handleSend}>
                    Send
                </button>

                <span className={`text-lg ${errorMessage == "Success!" ? 'text-green-400' : 'text-red-400'} ml-2`}>{errorMessage}</span>
            </div>
        </div>
    );
}
