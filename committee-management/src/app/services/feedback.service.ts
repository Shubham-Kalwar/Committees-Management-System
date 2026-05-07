import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EventFeedback, FeedbackAnalytics } from '../models/event-feedback.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly apiUrl = `${environment.apiUrl}/event-feedback`;

  constructor(private http: HttpClient) {}

  getFeedbackByEvent(eventId: number): Observable<EventFeedback[]> {
    return this.http.get<ApiResponse<EventFeedback[]>>(`${this.apiUrl}/event/${eventId}`).pipe(
      map((res) => res.data || [])
    );
  }

  submitFeedback(eventId: number, userId: number, rating: number, comment: string): Observable<EventFeedback> {
    return this.http.post<ApiResponse<EventFeedback>>(this.apiUrl, {
      eventId,
      userId,
      rating,
      comment
    }).pipe(
      map((res) => res.data as EventFeedback)
    );
  }

  getAnalytics(eventId: number): Observable<FeedbackAnalytics> {
    return this.http.get<ApiResponse<FeedbackAnalytics>>(`${this.apiUrl}/analytics/${eventId}`).pipe(
      map((res) => {
        const data = res.data;
        return {
          averageRating: data?.averageRating ?? 0,
          totalResponses: data?.totalResponses ?? 0,
          ratingDistribution: data?.ratingDistribution ?? {}
        };
      })
    );
  }

  deleteFeedback(feedbackId: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${feedbackId}`).pipe(
      map(() => void 0)
    );
  }
}
