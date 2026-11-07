export type FileUploadStatus =
    | 'announced'
    | 'uploading'
    | 'available'
    | 'failed'
    | 'cancelled';

export interface FileTransfer {
    id: string;
    sessionId: string;

    senderId: string;

    name: string;
    size: number;
    mimeType: string;

    uploadStatus: FileUploadStatus;

    checkSum?: string;

    createdAt?: Date;
    updatedAt?: Date;
    uploadedAt?: Date;
}
