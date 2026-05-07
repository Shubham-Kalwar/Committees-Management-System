import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FeedbackService } from '../../../services/feedback.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-feedback-form',
  standalone: false,
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.css'
})
export class FeedbackFormComponent implements OnInit {
  @Input() eventId!: number;
  @Output() submitted = new EventEmitter<void>();

  rating = 0;
  hoverRating = 0;
  comment = '';
  submitting = false;
  errorMessage = '';
  successMessage = '';
  alreadySubmitted = false;
  currentUserId: number | null = null;

  readonly maxCommentLength = 500;
  readonly stars = [1, 2, 3, 4, 5];

  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getMyProfile().subscribe({
      next: (profile) => {
        this.currentUserId = profile.userId ?? null;
      },
      error: () => {
        this.currentUserId = null;
      }
    });
  }

  get canSubmitFeedback(): boolean {
    return true; // All authenticated users can submit feedback
  }

  get isFormValid(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }

  get commentLength(): number {
    return this.comment.length;
  }

  getRatingLabel(): string {
    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[this.rating] || 'Select a rating';
  }

  onStarHover(star: number): void {
    this.hoverRating = star;
  }

  onStarLeave(): void {
    this.hoverRating = 0;
  }

  onStarClick(star: number): void {
    this.rating = star;
  }

  isStarActive(star: number): boolean {
    return star <= (this.hoverRating || this.rating);
  }

  submitFeedback(): void {
    if (!this.isFormValid || this.submitting || this.alreadySubmitted) return;

    if (!this.currentUserId) {
      this.errorMessage = 'Unable to identify your account. Please refresh and try again.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.feedbackService.submitFeedback(
      this.eventId,
      this.currentUserId,
      this.rating,
      this.comment.trim()
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = 'Thank you! Your feedback has been submitted.';
        this.alreadySubmitted = true;
        this.submitted.emit();
      },
      error: (err) => {
        this.submitting = false;
        if (err.status === 409) {
          this.errorMessage = 'You have already submitted feedback for this event.';
          this.alreadySubmitted = true;
        } else {
          this.errorMessage = err?.error?.error || err?.error?.message || 'Failed to submit feedback. Please try again.';
        }
      }
    });
  }
}
