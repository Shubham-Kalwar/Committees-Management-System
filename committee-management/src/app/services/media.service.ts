import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EventMedia } from '../models/event-media.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly apiUrl = `${environment.apiUrl}/event-media`;

  constructor(private http: HttpClient) {}

  getMediaByEvent(eventId: number): Observable<EventMedia[]> {
    return this.http.get<ApiResponse<EventMedia[]>>(`${this.apiUrl}/event/${eventId}`).pipe(
      map((res) => res.data || [])
    );
  }

  getMediaById(mediaId: number): Observable<EventMedia> {
    return this.http.get<ApiResponse<EventMedia>>(`${this.apiUrl}/${mediaId}`).pipe(
      map((res) => res.data as EventMedia)
    );
  }

  uploadMedia(eventId: number, file: File, mediaType: string): Observable<EventMedia> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId.toString());
    formData.append('mediaType', mediaType);

    return this.http.post<ApiResponse<EventMedia>>(`${this.apiUrl}/upload`, formData).pipe(
      map((res) => res.data as EventMedia)
    );
  }

  deleteMedia(mediaId: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${mediaId}`).pipe(
      map(() => void 0)
    );
  }

  /**
   * Determine media type based on file extension
   */
  resolveMediaType(file: File): 'IMAGE' | 'VIDEO' {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExtensions = ['mp4', 'webm', 'mov'];
    return videoExtensions.includes(ext) ? 'VIDEO' : 'IMAGE';
  }

  /**
   * Build the full URL for a media file
   */
  getMediaUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    // filePath is like /uploads/events/1/uuid_file.jpg
    return `${environment.apiUrl.replace('/api', '')}${filePath}`;
  }

  /**
   * Format file size to human-readable string
   */
  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
