import React, { useRef, useState } from 'react'
import ShinyText from '../misc/ShinyText';
import { InstantSession } from '@/lib/instant/InstantSession';
import { ReceivedFile } from '@/lib/instant/types';
import { DownloadManager } from '@/lib/instant/DownloadManager';

type ReceivedFileItem = Omit<ReceivedFile, "blob"> & {
    bytesReceived: number;
    transferProgress: number;

    file: ReceivedFile | null;

    downloading: boolean;
    downloadProgress: number;
}

export default function InstanReceive() {
    const [transferId, setTransferId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const sessionRef = useRef<InstantSession | null>(null);
    const [connected, setConnected] = useState(false);

    const [receivedFiles, setReceivedFiles] = useState<ReceivedFileItem[]>([]);

    const downloadManagerRef = useRef<DownloadManager | null>(null);

    if (downloadManagerRef.current === null) {
        downloadManagerRef.current = new DownloadManager();
    }

    const handleChooseDownloadFolder = async () => {
        try {
            setErrorMessage("");

            await downloadManagerRef.current!.chooseDirectory();

            setErrorMessage("Download folder selected");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to select download folder"
            )
        }
    }

    const handleReceive = async () => {
        if (!transferId) {
            setErrorMessage("Please Enter an ID");
            return;
        }

        try {
            setErrorMessage("");

            const session = new InstantSession(
                "receiver",
                {
                    onPeerConnected: () => {
                        setConnected(true);
                        setErrorMessage("Connected!");
                    },
                    onPeerDisconnected: () => {
                        setConnected(false);
                    },
                    onFileStart: (file) => {
                        setReceivedFiles((previous) => [
                            ...previous,
                            {
                                id: file.fileId,
                                name: file.name,
                                mimeType: file.mimeType,
                                size: file.size,

                                bytesReceived: 0,
                                transferProgress: 0,

                                file: null,

                                downloading: false,
                                downloadProgress: 0,
                            }
                        ]);
                    },
                    onReceiverProgress: (fileId, bytesReceived, totalBytes, progress) => {
                        setReceivedFiles((previous) => 
                            previous.map((item) => 
                                item.id === fileId
                                    ? {
                                        ...item,
                                        bytesReceived,
                                        size: totalBytes,
                                        transferProgress: progress,
                                    }
                                    : item
                            )
                        );
                    },
                    onFileReceived(file) {
                        console.log("[InstantReceive] FILE RECEIVED: ", file.name, file.size);

                        setReceivedFiles((previous) =>
                            previous.map((item) =>
                                item.id === file.id
                                    ? {
                                        ...item,
                                        file,
                                        bytesReceived: file.size,
                                        transferProgress: 100,
                                    }
                                    : item
                            )
                        );

                        void downloadReceivedFile(file);
                    },
                    onError: (error) => {
                        setErrorMessage(error.message);
                    }
                }
            );

            sessionRef.current = session;

            await session.join(transferId.trim().toUpperCase());
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to join session"
            );
        }
    }

    const downloadReceivedFile = async (file: ReceivedFile) => {
        setReceivedFiles((previous) => 
            previous.map((item) =>
                item.id === file.id
                    ? {
                        ...item,
                        downloading: true,
                        downloadProgress: 0,
                    }
                    : item
            )
        );

        try {
            await downloadManagerRef.current!.save(
                file,
                (_bytesReceived, _totalBytes, progress) => {
                    setReceivedFiles((previous) =>
                        previous.map((item) =>
                            item.id === file.id
                                ? {
                                    ...item,
                                    downloading: true,
                                    downloadProgress: progress,
                                }
                                : item
                        )
                    );
                }
            );

            setReceivedFiles((previous) =>
                previous.map((item) =>
                    item.id === file.id
                        ? {
                            ...item,
                            downloading: false,
                            downloadProgress: 100,
                        }
                        : item
                )
            );

            console.log("[InstantReceive] FILE SAVED: ", file.name);
        } catch (error) {
            setReceivedFiles((previous) =>
                previous.map((item) =>
                    item.id === file.id
                        ? {
                            ...item,
                            downloading: false,
                        }
                        : item
                )
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to save file"
            );
        }
    }

    return (
        <div className="flex flex-col gap-8 items-center justify-between flex-1 min-w-0 h-full">
            <div className='absolute top-2 right-2'>
                <button
                    type="button"
                    onClick={handleChooseDownloadFolder}
                    className="border px-4 py-2 border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
                >
                    Choose Download Folder
                </button>
            </div>

            <span className="text-4xl font-bold">RECEIVE</span>

            <div className="w-full h-full bg-purple-900/20 rounded-xl relative overflow-hidden">
                {receivedFiles.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShinyText
                            text={
                                connected
                                    ? "Connected!"
                                    : "Waiting..."
                            }
                            disabled={false}
                            speed={3}
                            className="text-2xl font-bold"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar">
                        <div className="flex flex-col gap-3">
                            {receivedFiles.map((file, index) => (
                                <div
                                    key={`${file.id}-${index}`}
                                    className="border border-purple-500 rounded-lg p-3"
                                >
                                    <div className="font-semibold truncate">
                                        {file.name}
                                    </div>

                                    <div className="text-sm text-neutral-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>

                                    {/* Transfer progress */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                            <span>
                                                {file.transferProgress >= 100
                                                    ? "Received"
                                                    : "Receiving"}
                                            </span>

                                            <span>
                                                {file.transferProgress.toFixed(0)}%
                                            </span>
                                        </div>

                                        <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-purple-500 to-blue-500 transition-[width] duration-100"
                                                style={{
                                                    width: `${file.transferProgress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Download progress */}
                                    {file.downloading && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                                <span>
                                                    Saving...
                                                </span>

                                                <span>
                                                    {file.downloadProgress.toFixed(0)}%
                                                </span>
                                            </div>

                                            <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 transition-[width] duration-100"
                                                    style={{
                                                        width: `${file.downloadProgress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {file.file && !file.downloading && (
                                        <button
                                            onClick={() => void downloadReceivedFile(file.file!)}
                                            className="mt-3 px-4 py-2 border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition-[background,scale] cursor-pointer active:scale-98"
                                        >
                                            Download Again
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full relative">
                <input type='text' value={transferId} onChange={(e) => setTransferId(e.target.value)} className={`border border-purple-500 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl ${transferId ? 'tracking-[8px]' : 'max-lg:text-sm'}  font-sans focus:outline-4 outline-purple-700 focus:border-purple-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`} maxLength={6} placeholder='Enter ID' required />
            </div>

            <div className="w-full flex items-center justify-between">
                <button className="w-40 h-12 self-start border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition-[background,scale] cursor-pointer active:scale-98" onClick={handleReceive}>
                    Receive
                </button>

                <span className={`text-lg ${errorMessage == "Connected!" ? 'text-green-400' : 'text-red-400'} ml-2`}>
                    {errorMessage}
                </span>
            </div>
        </div>
    );
}
