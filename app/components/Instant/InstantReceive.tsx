import React, {
    useEffect,
    useRef,
    useState
} from "react";

import ShinyText from "../misc/ShinyText";
import { InstantSession } from "@/lib/instant/InstantSession";
import { ReceivedFile } from "@/lib/instant/types";
import { DownloadManager } from "@/lib/instant/DownloadManager";
import { Spinner } from "../Spinner";

type ReceivedFileStatus =
    | "receiving"
    | "received"
    | "interrupted"
    | "cancelled";

type ReceivedFileItem =
    Omit<ReceivedFile, "blob"> & {
        bytesReceived: number;
        transferProgress: number;

        file: ReceivedFile | null;

        downloading: boolean;
        downloadProgress: number;

        status: ReceivedFileStatus;
    };

export default function InstantReceive() {
    const [transferId, setTransferId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [connected, setConnected] = useState(false);
    const [joiningCount, setJoiningCount] = useState(0);
    const [downloadDirectory, setDownloadDirectory] = useState<string | null>(null);
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFileItem[]>([]);

    /**
     * Every transfer ID owns its own session.
     *
     * ID1 -> Session1
     * ID2 -> Session2
     * ID3 -> Session3
     */
    const sessionsRef = useRef<Map<string, InstantSession>>(new Map());

    /**
     * IDs currently being connected.
     *
     * Prevents clicking Receive twice for the
     * same ID while allowing different IDs
     * to connect simultaneously.
     */
    const joiningIdsRef = useRef<Set<string>>(new Set());

    /**
     * Sessions that currently have an active
     * WebRTC connection.
     */
    const connectedIdsRef = useRef<Set<string>>(new Set());

    /**
     * Maps each reception to the session that
     * owns it. This is needed for Cancel.
     */
    const receptionSessionsRef = useRef<Map<string, InstantSession>>(new Map());

    const downloadManagerRef = useRef<DownloadManager | null>(null);

    const activeReceptionsRef = useRef<Set<string>>(new Set());

    if (downloadManagerRef.current === null) {
        downloadManagerRef.current = new DownloadManager();
    }

    const updateJoiningCount = () => {
        setJoiningCount(joiningIdsRef.current.size);
    };

    const updateConnectedState = () => {
        setConnected(connectedIdsRef.current.size > 0);
    };

    const handleChooseDownloadFolder =
        async () => {
            try {
                setErrorMessage("");

                await downloadManagerRef
                    .current!
                    .chooseDirectory();

                setDownloadDirectory(
                    downloadManagerRef
                        .current!
                        .directoryName
                );

                setErrorMessage(
                    "Download folder selected"
                );
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to select download folder"
                );
            }
        };

    const handleResetDownloadFolder = () => {
        downloadManagerRef
            .current!
            .clearDirectory();

        setDownloadDirectory(null);

        setErrorMessage(
            "Download folder reset"
        );
    };

    const handleClearReceivedFiles = () => {
        setReceivedFiles(
            (previous) =>
                previous.filter(
                    (file) => file.status === "receiving"
                )
        );

        setErrorMessage(
            "Received files cleared"
        );
    };

    const handleReceive = async () => {
        const id = transferId
            .trim()
            .toUpperCase();

        if (!id) {
            setErrorMessage(
                "Please Enter an ID"
            );
            return;
        }

        /**
         * Don't create two sessions for
         * the same transfer ID.
         */
        if (
            sessionsRef.current.has(id) ||
            joiningIdsRef.current.has(id)
        ) {
            setErrorMessage(
                `Transfer ${id} is already active`
            );
            return;
        }

        joiningIdsRef.current.add(id);
        updateJoiningCount();

        try {
            setErrorMessage("");

            const session =
                new InstantSession(
                    "receiver",
                    {
                        onPeerConnected: () => {
                            connectedIdsRef
                                .current
                                .add(id);

                            updateConnectedState();

                            setErrorMessage("Connected!");
                        },
                        onPeerDisconnected: () => {
                            connectedIdsRef
                                .current
                                .delete(id);

                            updateConnectedState();
                        },
                        onFileStart: (receptionId, file) => {
                            /**
                             * Remember which session
                             * owns this reception.
                             */
                            receptionSessionsRef
                                .current
                                .set(
                                    receptionId,
                                    session
                                );

                            activeReceptionsRef
                                .current
                                .add(
                                    receptionId
                                );

                            setReceivedFiles(
                                (previous) => [
                                    ...previous,
                                    {
                                        receptionId,
                                        id: file.fileId,
                                        name: file.name,
                                        mimeType:
                                            file.mimeType,
                                        size:
                                            file.size,

                                        bytesReceived: 0,
                                        transferProgress: 0,

                                        file: null,

                                        downloading: false,
                                        downloadProgress: 0,

                                        status: "receiving",
                                    },
                                ]
                            );
                        },
                        onReceiverProgress: (receptionId, fileId, bytesReceived, totalBytes, progress) => {
                            setReceivedFiles(
                                (previous) =>
                                    previous.map(
                                        (item) =>
                                            item.receptionId ===
                                            receptionId
                                                ? {
                                                    ...item,
                                                    id: fileId,
                                                    bytesReceived,
                                                    size: totalBytes,
                                                    transferProgress:
                                                        progress,
                                                }
                                                : item
                                    )
                            );
                        },
                        onFileReceived: (file) => {
                            console.log(
                                "[InstantReceive] FILE RECEIVED:",
                                file.name,
                                file.size
                            );

                            receptionSessionsRef
                                .current
                                .delete(
                                    file.receptionId
                                );

                            setReceivedFiles(
                                (previous) =>
                                    previous.map(
                                        (item) =>
                                            item.receptionId ===
                                            file.receptionId
                                                ? {
                                                    ...item,
                                                    file,
                                                    bytesReceived:
                                                        file.size,
                                                    transferProgress:
                                                        100,
                                                    status:
                                                        "received",
                                                }
                                                : item
                                    )
                            );

                            void downloadReceivedFile(
                                file
                            );
                        },
                        onTransferCompleted: () => {
                            const session = sessionsRef
                                .current
                                .get(id);

                            console.log(
                                "[InstantReceive] TRANSFER COMPLETE:",
                                id
                            );

                            if (!session) return;

                            sessionsRef
                                .current
                                .delete(id);

                            connectedIdsRef
                                .current
                                .delete(id);

                            updateConnectedState();

                            void session.destroy();
                        },
                        onReceptionAborted: (receptionId) => {
                            receptionSessionsRef
                                .current
                                .delete(
                                    receptionId
                                );

                            setReceivedFiles(
                                (previous) =>
                                    previous.map(
                                        (item) =>
                                            item.receptionId ===
                                            receptionId
                                                ? {
                                                    ...item,
                                                    status:
                                                        "interrupted",
                                                    downloading:
                                                        false,
                                                }
                                                : item
                                    )
                            );

                            setErrorMessage("Transfer Interrupted");
                        },
                        onReceptionCancelled:(receptionId) => {
                            receptionSessionsRef
                                .current
                                .delete(
                                    receptionId
                                );

                            setReceivedFiles(
                                (previous) =>
                                    previous.map(
                                        (item) =>
                                            item.receptionId ===
                                            receptionId
                                                ? {
                                                    ...item,
                                                    status:
                                                        "cancelled",
                                                    downloading:
                                                        false,
                                                }
                                                : item
                                    )
                            );
                        },
                        onError: (error) => {
                            setErrorMessage(error.message);
                        },
                    },
                    {
                        forceRelay: true,
                    }
                );

            /**
             * Store the session BEFORE join.
             */
            sessionsRef.current.set(
                id,
                session
            );

            await session.join(id);
        } catch (error) {
            /**
             * Remove only THIS transfer's session.
             */
            const session =
                sessionsRef.current.get(id);

            if (session) {
                sessionsRef.current.delete(id);

                await session.destroy();
            }

            connectedIdsRef
                .current
                .delete(id);

            updateConnectedState();

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to join session"
            );
        } finally {
            joiningIdsRef
                .current
                .delete(id);

            updateJoiningCount();
        }
    };

    const downloadReceivedFile =
        async (
            file: ReceivedFile
        ) => {
            setReceivedFiles(
                (previous) =>
                    previous.map(
                        (item) =>
                            item.receptionId ===
                            file.receptionId
                                ? {
                                    ...item,
                                    downloading: true,
                                    downloadProgress:
                                        0,
                                }
                                : item
                    )
            );

            try {
                await downloadManagerRef
                    .current!
                    .save(
                        file,
                        (
                            _bytesReceived,
                            _totalBytes,
                            progress
                        ) => {
                            setReceivedFiles(
                                (previous) =>
                                    previous.map(
                                        (item) =>
                                            item.receptionId ===
                                            file.receptionId
                                                ? {
                                                    ...item,
                                                    downloading:
                                                        true,
                                                    downloadProgress:
                                                        progress,
                                                }
                                                : item
                                    )
                            );
                        }
                    );

                setReceivedFiles(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.receptionId ===
                                file.receptionId
                                    ? {
                                        ...item,
                                        downloading:
                                            false,
                                        downloadProgress:
                                            100,
                                    }
                                    : item
                        )
                );

                console.log(
                    "[InstantReceive] FILE SAVED:",
                    file.name
                );
            } catch (error) {
                setReceivedFiles(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.receptionId ===
                                file.receptionId
                                    ? {
                                        ...item,
                                        downloading:
                                            false,
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
        };

    const handleCancelReception =
        (
            receptionId: string
        ) => {
            const session =
                receptionSessionsRef
                    .current
                    .get(
                        receptionId
                    );

            if (!session) {
                return;
            }

            session.cancelReception(
                receptionId
            );
        };

    useEffect(() => {
        return () => {
            /**
             * Destroy ALL active sessions
             * when the component unmounts.
             */
            const sessions =
                Array.from(
                    sessionsRef
                        .current
                        .values()
                );

            sessionsRef.current.clear();

            for (
                const session of sessions
            ) {
                void session.destroy();
            }

            joiningIdsRef.current.clear();
            connectedIdsRef.current.clear();
            receptionSessionsRef.current.clear();
        };
    }, []);

    return (
        <div className="flex flex-col gap-8 items-center justify-between flex-1 min-w-0 h-full min-h-0 max-lg:w-full">

            <div className="absolute top-2 left-2">
                <button
                    type="button"
                    onClick={() => {
                        const memory =
                            Array.from(
                                sessionsRef
                                    .current
                                    .entries()
                            ).map(
                                ([id, session]) => ({
                                    id,
                                    memory:
                                        session.debugRefeiverMemory,
                                })
                            );

                        console.log(
                            "[InstantReceive] DEBUG MEMORY:",
                            memory
                        );
                    }}
                    className="border px-4 py-2 border-green-500 rounded-lg bg-green-600 hover:bg-green-700 transition cursor-pointer max-sm:text-sm"
                >
                    Print Debug Memory
                </button>
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-3">

                {downloadDirectory && (
                    <>
                        <div className="text-sm text-neutral-300">
                            Download folder:{" "}
                            <span className="font-semibold text-blue-400">
                                {downloadDirectory}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleResetDownloadFolder
                            }
                            className="border px-4 py-2 border-red-500 rounded-lg bg-red-600 hover:bg-red-700 transition cursor-pointer"
                        >
                            Reset
                        </button>
                    </>
                )}

                {receivedFiles.length > 0 && (
                    <button
                        type="button"
                        onClick={
                            handleClearReceivedFiles
                        }
                        className="border px-4 py-2 border-red-500 rounded-lg bg-red-600 hover:bg-red-700 transition cursor-pointer"
                    >
                        Clear Files
                    </button>
                )}

                <button
                    type="button"
                    onClick={
                        handleChooseDownloadFolder
                    }
                    className="border px-4 py-2 border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition cursor-pointer max-sm:text-sm"
                >
                    Choose Download Folder
                </button>
            </div>

            <span className="text-4xl max-lg:text-2xl font-bold">
                RECEIVE
            </span>

            <div className="w-full h-full bg-purple-900/20 rounded-xl relative overflow-hidden">

                {joiningCount > 0 && (
                    <Spinner />
                )}

                {receivedFiles.length === 0 ? (
                    <div className="w-full h-full max-lg:min-h-40 flex items-center justify-center">
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

                            {receivedFiles.map(
                                (file) => (
                                    <div
                                        key={
                                            file.receptionId
                                        }
                                        className="border border-purple-500 rounded-lg p-3"
                                    >

                                        <div className="font-semibold truncate">
                                            {
                                                file.name
                                            }
                                        </div>

                                        <div className="text-sm text-neutral-400">
                                            {(
                                                file.size /
                                                1024 /
                                                1024
                                            ).toFixed(
                                                2
                                            )}{" "}
                                            MB
                                        </div>

                                        <div className="mt-3">

                                            <div className="flex justify-between text-xs text-neutral-400 mb-1">

                                                <span>
                                                    {
                                                        file.status ===
                                                        "received"
                                                            ? "Received"
                                                            : file.status ===
                                                                "interrupted"
                                                                ? "Interrupted"
                                                                : file.status ===
                                                                    "cancelled"
                                                                    ? "Cancelled"
                                                                    : "Receiving"
                                                    }
                                                </span>

                                                <span>
                                                    {file.transferProgress.toFixed(
                                                        0
                                                    )}
                                                    %
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

                                            {file.status ===
                                                "receiving" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCancelReception(
                                                            file.receptionId
                                                        )
                                                    }
                                                    className="mt-3 px-4 py-2 border border-red-500 rounded-lg bg-red-600 hover:bg-red-700 transition-[background,scale] cursor-pointer active:scale-98"
                                                >
                                                    Cancel
                                                </button>
                                            )}

                                        </div>

                                        {file.downloading && (
                                            <div className="mt-3">

                                                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                                    <span>
                                                        Saving...
                                                    </span>

                                                    <span>
                                                        {file.downloadProgress.toFixed(
                                                            0
                                                        )}
                                                        %
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

                                        {file.file &&
                                            !file.downloading && (
                                                <button
                                                    onClick={() =>
                                                        void downloadReceivedFile(
                                                            file.file!
                                                        )
                                                    }
                                                    className="mt-3 px-4 py-2 border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition-[background,scale] cursor-pointer active:scale-98"
                                                >
                                                    Download Again
                                                </button>
                                            )}

                                    </div>
                                )
                            )}

                        </div>
                    </div>
                )}
            </div>

            <div className="w-full relative">
                <input
                    type="text"
                    value={transferId}
                    onChange={(e) =>
                        setTransferId(
                            e.target.value
                        )
                    }
                    className={`border border-purple-500 w-full h-12 rounded-lg flex items-center p-2 text-center text-xl ${
                        transferId
                            ? "tracking-[8px]"
                            : "max-lg:text-sm"
                    } font-sans focus:outline-4 outline-purple-700 focus:border-purple-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms]`}
                    maxLength={6}
                    placeholder="Enter ID"
                    required
                />
            </div>

            <div className="w-full flex items-center justify-between">

                <button
                    className="w-40 h-12 self-start border border-blue-500 rounded-lg bg-blue-600 hover:bg-blue-700 transition-[background,scale] cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleReceive}
                    disabled={!transferId.trim()}
                >
                    Receive
                </button>

                <span
                    className={`text-lg ${
                        errorMessage ===
                        "Connected!"
                            ? "text-green-400"
                            : "text-blue-400"
                    } ml-2`}
                >
                    {errorMessage}
                </span>

            </div>
        </div>
    );
}
