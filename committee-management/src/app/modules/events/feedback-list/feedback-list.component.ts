import { Component, Input, OnInit } from '@angular/core';
import { EventFeedback } from '../../../models/event-feedback.model';
import { FeedbackService } from '../../../services/feedback.service';

@Component({
  selector: 'app-feedback-list',
  standalone: false,
  templateUrl: './feedback-list.component.html',
  styleUrl: './feedback-list.component.css'
})
export class FeedbackListComponent implements OnInit {
  @Input() eventId!: number;

  feedbackItems: EventFeedback[] = [];
  loading = true;
  errorMessage = '';

  readonly stars = [1, 2, 3, 4, 5];

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  loadFeedback(): void {
    if (!this.eventId) return;
    this.loading = true;
    this.errorMessage = '';

    this.feedbackService.getFeedbackByEvent(this.eventId).subscribe({
      next: (items) => {
        this.loading = false;
        this.feedbackItems = items || [];
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load feedback.';
      }
    });
  }

  getUserName(feedback: EventFeedback): string {
    return feedback.user?.name || feedback.user?.login?.email || 'Anonymous';
  }

  getUserInitial(feedback: EventFeedback): string {
    const name = this.getUserName(feedback);
    return name.charAt(0).toUpperCase();
  }

  getAvatarColor(feedback: EventFeedback): string {
    const name = this.getUserName(feedback);
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#06b6d4', '#6366f1', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  isStarFilled(star: number, rating: number): boolean {
    return star <= rating;
  }
}
