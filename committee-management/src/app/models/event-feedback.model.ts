export interface EventFeedback {
  feedbackId?: number;
  event?: { eventId: number; eventName?: string };
  user?: { userId: number; name?: string; login?: { email?: string } };
  rating: number;
  comments?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export interface FeedbackAnalytics {
  averageRating: number;
  totalResponses: number;
  ratingDistribution: Record<number, number>;
}
