import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Event } from '../models/event.model';
import { ApiResponse } from '../models/auth.model';
import { EventRegistration, RegistrationStatus } from '../models/registration.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/events`;
  private readonly registrationUrl = `${environment.apiUrl}/registrations`;

  constructor(private http: HttpClient) {}

  getEvents(): Observable<Event[]> {
    return this.http.get<ApiResponse<unknown[]>>(this.apiUrl).pipe(
      map((res) => (res.data || []).map((item) => this.mapEvent(item)))
    );
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => this.mapEvent(res.data))
    );
  }

  createEvent(payload: Event): Observable<Event> {
    return this.http.post<ApiResponse<unknown>>(this.apiUrl, this.mapCreatePayload(payload)).pipe(
      map((res) => this.mapEvent(res.data))
    );
  }

  registerForEvent(eventId: number, userId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(this.registrationUrl, {
      user_id: userId,
      event_id: eventId
    });
  }

  getPendingRegistrations(): Observable<EventRegistration[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.registrationUrl}/pending`).pipe(
      map((res) => (res.data || []).map((item) => this.mapRegistration(item)))
    );
  }

  approveRegistration(registrationId: number): Observable<EventRegistration> {
    return this.http.patch<ApiResponse<unknown>>(`${this.registrationUrl}/${registrationId}/approve`, {}).pipe(
      map((res) => this.mapRegistration(res.data))
    );
  }

  rejectRegistration(registrationId: number): Observable<EventRegistration> {
    return this.http.patch<ApiResponse<unknown>>(`${this.registrationUrl}/${registrationId}/reject`, {}).pipe(
      map((res) => this.mapRegistration(res.data))
    );
  }

  getRegistrationsForUser(userId: number): Observable<EventRegistration[]> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return of([]);
    }

    return this.http.get<ApiResponse<unknown[]>>(`${this.registrationUrl}/user/${userId}`).pipe(
      map((res) => (res.data || []).map((item) => this.mapRegistration(item)))
    );
  }

  getRegisteredEventsForUser(userId: number): Observable<Event[]> {
    return this.getRegistrationsForUser(userId).pipe(
      map((res) => {
        const events = res
          .map((registration) => {
            const eventId = Number(registration.eventId);
            if (!Number.isFinite(eventId) || eventId <= 0) {
              return undefined;
            }

            return {
              id: eventId,
              eventName: registration.eventName || 'Event',
              eventDate: registration.eventDate || '',
              location: registration.eventLocation,
              registrationId: registration.id,
              registrationStatus: registration.status,
              registeredAt: registration.registeredAt,
              approvedAt: registration.approvedAt
            } as Event;
          })
          .filter((event): event is Event => !!event?.id);

        const seen = new Set<number>();
        return events.filter((event) => {
          const eventId = Number(event.id);
          if (!Number.isFinite(eventId) || seen.has(eventId)) {
            return false;
          }

          seen.add(eventId);
          return true;
        });
      })
    );
  }

  private mapRegistration(raw: unknown): EventRegistration {
    const data = (raw || {}) as {
      participantId?: number;
      registrationId?: number;
      id?: number;
      status?: string;
      registeredAt?: string;
      approvedAt?: string;
      attended?: boolean;
      user?: { userId?: number; name?: string; email?: string };
      event?: { eventId?: number; eventName?: string; eventDate?: string; location?: string; venue?: string };
    };

    return {
      id: data.participantId ?? data.registrationId ?? data.id,
      userId: data.user?.userId ?? 0,
      userName: data.user?.name,
      userEmail: data.user?.email,
      eventId: data.event?.eventId ?? 0,
      eventName: data.event?.eventName,
      eventDate: data.event?.eventDate,
      eventLocation: data.event?.location ?? data.event?.venue,
      status: this.normalizeRegistrationStatus(data.status),
      attended: data.attended,
      registeredAt: data.registeredAt,
      approvedAt: data.approvedAt ?? null
    };
  }

  private normalizeRegistrationStatus(rawStatus: unknown): RegistrationStatus {
    const status = String(rawStatus || '').trim().toUpperCase();
    if (status === 'APPROVED' || status === 'REJECTED') {
      return status;
    }

    return 'PENDING';
  }

  private mapEvent(raw: unknown): Event {
    const data = (raw || {}) as {
      eventId?: number;
      id?: number;
      eventName?: string;
      description?: string;
      eventDate?: string;
      location?: string;
      venue?: string;
      status?: string;
      maxParticipants?: number;
      committee?: { committeeId?: number };
      category?: { categoryId?: number };
      committeeId?: number;
      categoryId?: number;
    };

    const mappedEvent = {
      id: data.eventId ?? data.id,
      eventName: data.eventName || '',
      description: data.description,
      eventDate: data.eventDate || '',
      location: data.location ?? data.venue,
      status: data.status,
      maxParticipants: data.maxParticipants,
      committeeId: data.committee?.committeeId ?? data.committeeId,
      categoryId: data.category?.categoryId ?? data.categoryId
    };
    return this.transformDemoEvent(mappedEvent);
  }

  private transformDemoEvent(event: Event): Event {
    if (!event.id) return event;
    const demoEvents = [
      {
        eventName: "Angular Bootcamp 2026",
        description: "Hands-on workshop covering Angular, REST APIs, and Spring Boot integration.",
        location: "Seminar Hall A",
        status: "UPCOMING"
      },
      {
        eventName: "Annual Tech Fest",
        description: "The biggest technology festival of the year featuring hackathons and guest lectures.",
        location: "Main Auditorium",
        status: "UPCOMING"
      },
      {
        eventName: "Cultural Night",
        description: "An evening of music, dance, and cultural performances by various student groups.",
        location: "Open Air Theatre",
        status: "ONGOING"
      },
      {
        eventName: "Sports Meet 2026",
        description: "Inter-departmental sports competition featuring football, basketball, and athletics.",
        location: "University Sports Complex",
        status: "UPCOMING"
      },
      {
        eventName: "Alumni Meet & Greet",
        description: "Networking session with distinguished alumni from top tech companies.",
        location: "Conference Room 1",
        status: "COMPLETED"
      }
    ];

    const mapped = demoEvents[event.id % demoEvents.length];
    return {
      ...event,
      eventName: mapped.eventName,
      description: mapped.description,
      location: mapped.location,
      status: mapped.status
    };
  }

  private mapCreatePayload(payload: Event): unknown {
    return {
      eventName: payload.eventName,
      description: payload.description,
      eventDate: payload.eventDate,
      location: payload.location,
      status: payload.status || 'PLANNED',
      maxParticipants: payload.maxParticipants ?? 50,
      committee: { committeeId: payload.committeeId ?? 1 },
      ...(payload.categoryId ? { category: { categoryId: payload.categoryId } } : {})
    };
  }
}
