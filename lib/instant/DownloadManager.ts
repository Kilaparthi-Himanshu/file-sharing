import { ReceivedFile } from "./types";

type DirectoryPickerOptions = {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?:
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos";
}

declare global {
    interface Window {
        showDirectoryPicker(
            options?: DirectoryPickerOptions
        ): Promise<FileSystemDirectoryHandle>;
    }
}

export class DownloadManager {
    private directory: FileSystemDirectoryHandle | null = null;

    get hasDirectory(): boolean {
        return this.directory !== null;
    }

    async chooseDirectory(): Promise<void> {
        if (!("showDirectoryPicker" in window)) {
            throw new Error("Automatic downloads are not supported by this browser");
        }

        this.directory = await window.showDirectoryPicker({
            id: "blinkshare-downloads",
            mode: "readwrite",
            startIn: "downloads",
        });
    }

    async save(file: ReceivedFile): Promise<void> {
        if (this.directory) {
            this.saveToDirectory(file);
            return;
        }

        this.downloadToBrowser(file);
    }

    private async saveToDirectory(file: ReceivedFile): Promise<void> {
        const fileName = await this.getAvailableFileName(file.name);

        const fileHandle = await this.directory!.getFileHandle(
            fileName,
            { create: true },
        );

        const writable = await fileHandle.createWritable();

        try {
            await writable.write(file.blob);
        } finally {
            await writable.close();
        }
    }

    private downloadToBrowser(file: ReceivedFile): void {
        const url = URL.createObjectURL(file.blob);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = file.name;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    private async getAvailableFileName(originalName: string): Promise<string> {
        if (!this.directory) {
            throw new Error("Download folder has not been selected");
        }

        try {
            await this.directory.getFileHandle(originalName);

            // File already exists.
        } catch {
            return originalName;

            // File dosen't exist so we return originalName.
        }

        const lastDot = originalName.lastIndexOf(".");

        const hasExtension =
            lastDot > 0 &&
            lastDot < originalName.length - 1;

        const baseName =
            hasExtension
                ? originalName.slice(0, lastDot)
                : originalName;

        const extension =
            hasExtension
                ? originalName.slice(lastDot)
                : "";

        let counter = 1;

        while (true) {
            const candidate = `${baseName} (${counter})${extension}`;

            try {
                await this.directory.getFileHandle(candidate);

                counter++;
            } catch {
                return candidate;

                // File dosen't exist so we return newly constructed name.
            }
        }
    }

    clearDirectory(): void {
        this.directory = null;
    }
}
