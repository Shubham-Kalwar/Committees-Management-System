export type AnnouncementType = 'event' | 'task' | 'general';

export interface Announcement {
  id?: number;
  title?: string;
  message: string;
  type?: AnnouncementType;
  referenceId?: number | null;
  read?: boolean;
  important?: boolean;
  committeeId?: number;
  userId?: number;
  createdAt?: string;
}
