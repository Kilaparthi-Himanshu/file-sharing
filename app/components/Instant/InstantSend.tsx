import React, {
    useEffect,
    useRef,
    useState
} from "react";

import { FaRegFile } from "react-icons/fa6";

import {
    InstantSession
} from "@/lib/instant/InstantSession";

type ActiveTransfer = {
    id: string;
    connectedPeers: number;
};

export default function InstantSend() {
    const [files, setFiles] =useState<File[]>([]);
    const fileRef =useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] =useState<string>("");
    /**
     * Every transfer ID gets its own session.
     */
    const sessionsRef = useRef<Map<string, InstantSession>>(new Map());

    const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([]);
    const latestTransferId = activeTransfers[activeTransfers.length - 1]?.id;

    const updateTransferPeers = (
        id: string,
        connectedPeers: number
    ) => {
        setActiveTransfers(
            (previous) =>
                previous.map(
                    (transfer) =>
                        transfer.id === id
                            ? {
                                ...transfer,
                                connectedPeers,
                            }
                            : transfer
                )
        );
    };

    const addTransfer = (
        id: string
    ) => {
        setActiveTransfers(
            (previous) => [
                ...previous,
                {
                    id,
                    connectedPeers: 0,
                },
            ]
        );
    };

    const removeTransfer = (
        id: string
    ) => {
        setActiveTransfers(
            (previous) =>
                previous.filter(
                    (transfer) =>
                        transfer.id !== id
                )
        );
    };

    const handleDragOver = (
        event: React.DragEvent<HTMLDivElement>
    ) => {
        event.preventDefault();
    };

    const resetSelectedFilesUI = () => {
        setErrorMessage("");
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>
    ) => {
        event.preventDefault();

        const droppedFiles = event.dataTransfer.files;

        if (
            !droppedFiles ||
            droppedFiles.length === 0
        ) {
            return;
        }

        setFiles(Array.from(droppedFiles));

        resetSelectedFilesUI();
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles =
            event.target.files;

        if (
            !selectedFiles ||
            selectedFiles.length === 0
        ) {
            return;
        }

        setFiles(Array.from(selectedFiles));

        resetSelectedFilesUI();

        // Allows selecting the exact same
        // files again later.
        event.target.value = "";
    };

    const handleSend = async () => {
        if (files.length === 0) {
            setErrorMessage("Please Select a File");

            return;
        }

        try {
            setErrorMessage("");

            /**
             * IMPORTANT:
             *
             * Capture the selected files for THIS
             * session.
             *
             * This means changing the file picker
             * later will not affect an already-running
             * transfer.
             */
            const filesForTransfer = [
                ...files
            ];

            const session =
                new InstantSession(
                    "sender",
                    {
                        onSessionCreated: (id) => {
                            addTransfer(
                                id
                            );
                        },
                        onSessionDestroyed: (id) => {
                            sessionsRef.current.delete(id);
                            removeTransfer(id);
                        },
                        onPeerConnected: (_peerId, count) => {
                            const id =
                                session.id;

                            if (!id) {
                                return;
                            }

                            updateTransferPeers(
                                id,
                                count
                            );
                        },
                        onPeerDisconnected:(_peerId, count) => {
                            const id =
                                session.id;

                            if (!id) {
                                return;
                            }

                            updateTransferPeers(
                                id,
                                count
                            );
                        },
                        onSendProgress:(_peerId, _progress) => {
                            // Transfer progress can be
                            // added to the UI later.
                        },
                        onFileSent:(_peerId, fileId) => {
                            console.log(
                                "[InstantSend] File sent:",
                                fileId
                            );
                        },
                        onError: (error) => {
                            console.error(
                                "[InstantSend]",
                                error
                            );

                            setErrorMessage(
                                error.message
                            );
                        },
                    },
                    {
                        forceRelay: true,
                    }
                );

            /**
             * create() generates the transfer ID.
             */
            const id = await session.create(filesForTransfer);

            /**
             * Keep this session alive independently
             * of every other transfer.
             */
            sessionsRef.current.set(id, session);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to create session"
            );
        }
    };

    useEffect(() => {
        return () => {
            /**
             * Destroy every active sender session.
             */
            const sessions =
                Array.from(sessionsRef.current.values());

            sessionsRef.current.clear();

            for (
                const session of sessions
            ) {
                void session.destroy();
            }
        };
    }, []);

    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isCompactDropZone, setIsCompactDropZone] = useState(false);

    useEffect(() => {
        const element = dropZoneRef.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            const height = entry.contentRect.height;

            setIsCompactDropZone(height < 120);
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 items-center justify-between flex-1 min-w-0 h-full min-h-0 max-lg:w-full">

             <div className="flex flex-col self-start">
                <span className="text-4xl max-lg:text-2xl font-bold">
                    SEND
                </span>

                <span className="text-zinc-600">
                    Choose files to send directly.
                </span>
            </div>

            <div
                className="border-2 border-dashed border-purple-700 bg-zinc-900 w-full lg:min-h-30 flex-1 rounded-xl flex flex-col items-center justify-center gap-6 max-lg:gap-3 p-4 group"
                onClick={() =>
                    fileRef.current?.click()
                }
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                ref={dropZoneRef}
            >
                {isCompactDropZone ? (
                    <div className="flex items-center gap-3">
                        <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                            <FaRegFile
                                size={25}
                                className="text-purple-400 shrink-0"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-lg text-zinc-200 font-semibold text-center">
                                Drag & drop files here.
                            </span>

                            <span className="text-zinc-500 text-sm">
                                or click anywhere to browse
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4">

                        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                            <FaRegFile
                                size={30}
                                className="text-purple-400 shrink-0"
                            />
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                            <span className="text-lg text-zinc-200 font-semibold text-center">
                                Drag & drop files here.
                            </span>

                            <span className="text-zinc-500 text-sm">
                                or click anywhere to browse
                            </span>
                        </div>

                        <span className="text-zinc-500 text-sm">
                            FILES · IMAGES · VIDEO · AUDIO · DOCUMENTS
                        </span>
                    </div>
                )}
            </div>

            <div
                className="w-full h-max min-h-12 flex flex-col gap-1"
                onClick={() =>
                    fileRef.current?.click()
                }
            >
                <span className="text-zinc-300 font-semibold">Selected</span>

                <div className="border border-purple-500 bg-zinc-900 w-full h-full rounded-xl flex items-center overflow-hidden">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileRef}
                        onChange={
                            handleFileChange
                        }
                    />

                    {files.length > 0 ? (
                        <div className="w-full h-full min-h-0 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-2 p-2">
                                {files.map(
                                    (
                                        file,
                                        index
                                    ) => (
                                        <div
                                            key={`${file.name}-${file.lastModified}-${index}`}
                                            className="text-sm truncate bg-zinc-800 border border-blue-500 p-1 rounded-lg"
                                        >
                                            <span className="font-bold text-purple-400">
                                                {index + 1}.
                                            </span>{" "}

                                            <span className="text-zinc-200">
                                                {file.name}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm p-2 text-zinc-400">
                            No files selected.
                        </span>
                    )}
                </div>
            </div>

            {activeTransfers.length > 0 && (
                <div className="w-full bg-zinc-900 border border-purple-500 rounded-xl text-center shrink-0 relative overflow-hidden">

                    <div className="absolute top-0 inset-x-0 z-10 h-11 px-4 flex justify-between items-center backdrop-blur-sm bg-gradient-to-b from-zinc-900 to-zinc-900/30">
                        <span className="font-semibold text-zinc-300">Active Transfers</span>
                    </div>

                    <div className="flex flex-col gap-3 max-h-48 overflow-y-auto custom-scrollbar p-2 pt-14">

                        {[...activeTransfers].reverse().map((transfer, index) => (
                            <div
                                key={transfer.id}
                                className="bg-zinc-800 border border-purple-500 rounded-lg p-3 shrink-0 flex justify-between relative overflow-hidden"
                            >
                                {transfer.id === latestTransferId &&
                                    <div className="absolute top-0.5 right-0.5 size-max bg-green-400 text-zinc-700 text-[10px] rounded-lg px-1 font-bold">
                                        Latest
                                    </div>
                                }

                                <div className="text-2xl font-bold tracking-[8px] -mr-[8px]">
                                    {transfer.id}
                                </div>

                                <div className="text-sm text-zinc-300 mt-2">
                                    Receivers connected:{" "}

                                    <span className="text-blue-400 font-semibold">{transfer.connectedPeers}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full flex flex-col items-center justify-between shrink-0">

                <button
                    className="w-full h-12 self-start border border-blue-500 rounded-lg bg-blue-600/50 hover:bg-blue-700/30 transition-[background,scale] cursor-pointer active:scale-98"
                    onClick={
                        handleSend
                    }
                >
                    Send
                </button>

                <span
                    className={`text-lg ${
                        errorMessage ===
                        "Success!"
                            ? "text-green-400"
                            : "text-red-400"
                    } ml-2`}
                >
                    {
                        errorMessage
                    }
                </span>

            </div>

        </div>
    );
}
