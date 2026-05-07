import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MediaService } from '../../../services/media.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-media-upload',
  standalone: false,
  templateUrl: './media-upload.component.html',
  styleUrl: './media-upload.component.css'
})
export class MediaUploadComponent {
  @Input() eventId!: number;
  @Output() uploaded = new EventEmitter<void>();

  isDragging = false;
  selectedFiles: File[] = [];
  previews: { file: File; url: string; type: 'IMAGE' | 'VIDEO' }[] = [];
  uploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  private readonly allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'];
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor(
    private mediaService: MediaService,
    private authService: AuthService
  ) {}

  get canUpload(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'FACULTY']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private handleFiles(files: File[]): void {
    this.errorMessage = '';
    this.successMessage = '';

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!this.allowedExtensions.includes(ext)) {
        this.errorMessage = `File "${file.name}" has an unsupported type. Allowed: ${this.allowedExtensions.join(', ')}`;
        continue;
      }
      if (file.size > this.maxFileSize) {
        this.errorMessage = `File "${file.name}" exceeds 50MB limit.`;
        continue;
      }

      const mediaType = this.mediaService.resolveMediaType(file);
      const url = URL.createObjectURL(file);
      this.previews.push({ file, url, type: mediaType });
      this.selectedFiles.push(file);
    }
  }

  removeFile(index: number): void {
    URL.revokeObjectURL(this.previews[index].url);
    this.previews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  uploadAll(): void {
    if (this.uploading || this.selectedFiles.length === 0) return;

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    let completed = 0;
    const total = this.selectedFiles.length;

    for (let i = 0; i < this.previews.length; i++) {
      const preview = this.previews[i];
      const mediaType = preview.type;

      this.mediaService.uploadMedia(this.eventId, preview.file, mediaType).subscribe({
        next: () => {
          completed++;
          this.uploadProgress = Math.round((completed / total) * 100);
          if (completed === total) {
            this.uploading = false;
            this.successMessage = `${total} file(s) uploaded successfully!`;
            this.clearPreviews();
            this.uploaded.emit();
          }
        },
        error: (err) => {
          completed++;
          this.uploadProgress = Math.round((completed / total) * 100);
          this.errorMessage = err?.error?.error || err?.error?.message || 'Upload failed for one or more files.';
          if (completed === total) {
            this.uploading = false;
            this.uploaded.emit();
          }
        }
      });
    }
  }

  private clearPreviews(): void {
    this.previews.forEach(p => URL.revokeObjectURL(p.url));
    this.previews = [];
    this.selectedFiles = [];
  }

  formatSize(bytes: number): string {
    return this.mediaService.formatFileSize(bytes);
  }
}
