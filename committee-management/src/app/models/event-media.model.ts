export interface EventMedia {
  mediaId: number;
  event?: { eventId: number; eventName?: string };
  filePath: string;
  fileName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  updatedAt?: string;
}
