import { generateTransferId } from "./types";

export type TransferFile = {
    id: string;
    file: File;
}

export type TransferStatus=
    | "pending"
    | "transferring"
    | "completed"
    | "failed"
    | "cancelled";

export type TransferProgress = {
    fileId: string;
    bytesTransferred: number;
    totalBytes: number;
}

export class Transfer {
    private readonly transferId: string;

    private readonly files: TransferFile[];

    private status: TransferStatus = "pending";

    private readonly progress = new Map<string, TransferProgress>();

    constructor(
        files: File[],
        transferId?: string,
    ) {
        if (files.length === 0) {
            throw new Error("A transfer must contain atleast one file");
        }

        this.transferId = transferId ?? generateTransferId();

        this.files = files.map((file, index) => {
            const fileId = `${index}-${crypto.randomUUID()}`;

            const progress: TransferProgress = {
                fileId,
                bytesTransferred: 0,
                totalBytes: file.size,
            }

            this.progress.set(fileId, progress);

            return {
                id: fileId,
                file,
            }
        });
    }

    get id(): string {
        return this.transferId;
    }

    get fileCount(): number {
        return this.files.length;
    }

    get transferFiles(): readonly TransferFile[] {
        return this.files;
    }

    get transferStatus(): TransferStatus {
        return this.status;
    }

    getProgress(fileId: string): TransferProgress | undefined {
        return this.progress.get(fileId);
    }

    get totalBytes(): number {
        return this.files.reduce((total, { file }) => total + file.size, 0);
    }

    get transferredBytes(): number {
        let total = 0;

        for (const progress of this.progress.values()) {
            total += progress.bytesTransferred;
        }

        return total;
    }

    get overallProgress(): number {
        const total = this.totalBytes;

        if (total === 0) {
            return 100;
        }

        return (this.transferredBytes / total) * 100;
    }

    setStatus(status: TransferStatus): void {
        this.status = status;
    }

    updateProgress(fileId: string, bytesTransferred: number): void {
        const progress = this.progress.get(fileId);

        if (!progress) {
            throw new Error(`Unknown transfer file: ${fileId}`);
        }

        progress.bytesTransferred = Math.min(bytesTransferred, progress.totalBytes);
    }

    isComplete(): boolean {
        for (const progress of this.progress.values()) {
            if (progress.bytesTransferred < progress.totalBytes) {
                return false;
            }
        }

        return true;
    }
}
