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

    const [ activeTransfers, setActiveTransfers ] = useState<ActiveTransfer[]>([]);

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
        <div className="flex flex-col gap-8 items-center justify-between flex-1 min-w-0 h-full min-h-0 max-lg:w-full">

            <span className="text-4xl max-lg:text-2xl font-bold">
                SEND
            </span>

            <div
                className="border-2 border-dashed border-purple-500 w-full lg:min-h-30 flex-1 rounded-xl flex flex-col items-center justify-center gap-6 max-lg:gap-3 p-4 lg:pt-2 group"
                onClick={() =>
                    fileRef.current?.click()
                }
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                ref={dropZoneRef}
            >
                {isCompactDropZone ? (
                    <div className="flex items-center gap-3">
                        <FaRegFile
                            size={32}
                            className="text-white shrink-0"
                        />

                        <span className="text-center text-xl">
                            Drag and drop files or click to browse.
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6">

                        <FaRegFile
                            size={60}
                            className="text-white group-active:scale-90 transition-[scale]"
                        />

                        <span className="text-xl text-center">
                            Drag and drop files or click to browse.
                        </span>

                        <span className="text-white">
                            PDF, image, video, or audio.
                        </span>

                    </div>
                )}
            </div>

            <div
                className="w-full h-max min-h-12"
                onClick={() =>
                    fileRef.current?.click()
                }
            >
                <div className="border border-purple-500 w-full h-full rounded-lg flex items-center p-2 overflow-hidden">

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
                        <div className="w-full h-full min-h-0 overflow-y-auto border border-purple-500 rounded-lg p-2 custom-scrollbar">

                            <div className="flex flex-col gap-2">

                                {files.map(
                                    (
                                        file,
                                        index
                                    ) => (
                                        <div
                                            key={`${file.name}-${file.lastModified}-${index}`}
                                            className="text-sm truncate"
                                        >
                                            <span className="font-bold text-blue-400">
                                                {index + 1}.
                                            </span>{" "}
                                            {file.name}
                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    ) : (
                        <span>
                            Choose A File/Files.
                        </span>
                    )}

                </div>
            </div>

            {activeTransfers.length > 0 && (
                <div className="w-full border border-purple-500 rounded-lg p-4 text-center shrink-0">

                    <div className="text-sm text-purple-300 mb-3">
                        Active Transfers
                    </div>

                    <div className="flex flex-col gap-3 max-h-44 overflow-y-auto custom-scrollbar pr-1">

                        {activeTransfers.map((transfer) => (
                            <div
                                key={transfer.id}
                                className="border border-purple-500 rounded-lg p-3 shrink-0"
                            >

                                <div className="text-2xl font-bold tracking-[8px] -mr-[8px]">
                                    {transfer.id}
                                </div>

                                <div className="text-sm text-neutral-300 mt-2">
                                    Receivers connected:{" "}
                                    {transfer.connectedPeers}
                                </div>

                            </div>
                        ))}

                    </div>

                </div>
            )}

            <div className="w-full flex items-center justify-between shrink-0">

                <button
                    className="w-40 h-12 self-start border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition-[background,scale] cursor-pointer active:scale-98"
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
