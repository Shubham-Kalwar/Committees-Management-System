import { Component, Input, OnInit } from '@angular/core';
import { EventMedia } from '../../../models/event-media.model';
import { MediaService } from '../../../services/media.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-media-gallery',
  standalone: false,
  templateUrl: './media-gallery.component.html',
  styleUrl: './media-gallery.component.css'
})
export class MediaGalleryComponent implements OnInit {
  @Input() eventId!: number;

  mediaItems: EventMedia[] = [];
  loading = true;
  errorMessage = '';
  selectedMedia: EventMedia | null = null;
  deleting = new Set<number>();

  constructor(
    private mediaService: MediaService,
    private authService: AuthService
  ) {}

  get canDelete(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'FACULTY']);
  }

  get imageCount(): number {
    return this.mediaItems.filter(m => m.fileType === 'IMAGE').length;
  }

  get videoCount(): number {
    return this.mediaItems.filter(m => m.fileType === 'VIDEO').length;
  }

  ngOnInit(): void {
    this.loadMedia();
  }

  loadMedia(): void {
    if (!this.eventId) return;
    this.loading = true;
    this.errorMessage = '';

    this.mediaService.getMediaByEvent(this.eventId).subscribe({
      next: (items) => {
        this.loading = false;
        this.mediaItems = items || [];
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load media gallery.';
      }
    });
  }

  getMediaUrl(item: EventMedia): string {
    return this.mediaService.getMediaUrl(item.filePath);
  }

  formatSize(bytes: number | undefined): string {
    return this.mediaService.formatFileSize(bytes);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openLightbox(media: EventMedia): void {
    this.selectedMedia = media;
  }

  closeLightbox(): void {
    this.selectedMedia = null;
  }

  onLightboxBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('lightbox-overlay')) {
      this.closeLightbox();
    }
  }

  deleteMedia(mediaId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.deleting.has(mediaId)) return;

    this.deleting.add(mediaId);
    this.mediaService.deleteMedia(mediaId).subscribe({
      next: () => {
        this.deleting.delete(mediaId);
        this.mediaItems = this.mediaItems.filter(m => m.mediaId !== mediaId);
        if (this.selectedMedia?.mediaId === mediaId) {
          this.closeLightbox();
        }
      },
      error: () => {
        this.deleting.delete(mediaId);
      }
    });
  }

  isDeleting(mediaId: number): boolean {
    return this.deleting.has(mediaId);
  }
}
