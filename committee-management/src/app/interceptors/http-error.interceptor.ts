import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

/**
 * Global HTTP error interceptor that displays user-friendly toast
 * notifications for server errors. Designed to complement the
 * JwtInterceptor (which already handles 401 → login redirects).
 *
 * Only non-suppressed errors produce toasts. 401 is skipped here
 * because the JwtInterceptor manages session expiry.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  /** URLs whose errors should never produce a global toast. */
  private readonly suppressedUrlPatterns = [
    '/api/auth/login',
    '/api/auth/register'
  ];

  /** Debounce: avoid showing duplicate toasts for the same message within this window. */
  private readonly deduplicationWindowMs = 3000;
  private lastToastMessage = '';
  private lastToastTimestamp = 0;

  constructor(private notificationService: NotificationService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && !this.isSuppressed(req.url)) {
          this.handleHttpError(error);
        }
        return throwError(() => error);
      })
    );
  }

  private handleHttpError(error: HttpErrorResponse): void {
    // 401 is handled by JwtInterceptor — skip here
    if (error.status === 401) {
      return;
    }

    const message = this.extractUserMessage(error);

    if (this.isDuplicate(message)) {
      return;
    }

    this.lastToastMessage = message;
    this.lastToastTimestamp = Date.now();

    const level = error.status === 403 ? 'warning' as const : 'error' as const;
    this.notificationService.showToast(message, level);
  }

  private extractUserMessage(error: HttpErrorResponse): string {
    // Attempt to read the backend ResponceBean shape: { message, error }
    const body = error.error;
    if (body && typeof body === 'object') {
      const bodyMessage = (body as Record<string, unknown>)['message'];
      const bodyError = (body as Record<string, unknown>)['error'];

      // Prefer the "error" field (which has specific detail) over generic "message"
      if (typeof bodyError === 'string' && bodyError.trim()) {
        return bodyError.trim();
      }

      if (typeof bodyMessage === 'string' && bodyMessage.trim()) {
        return bodyMessage.trim();
      }
    }

    if (error.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    if (error.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error.status === 409) {
      return 'This action conflicts with the current state. Please refresh and try again.';
    }

    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.status >= 500) {
      return 'Something went wrong on the server. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private isSuppressed(url: string): boolean {
    return this.suppressedUrlPatterns.some((pattern) => url.includes(pattern));
  }

  private isDuplicate(message: string): boolean {
    return message === this.lastToastMessage && (Date.now() - this.lastToastTimestamp) < this.deduplicationWindowMs;
  }
}
