import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Task } from '../models/task.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<ApiResponse<unknown[]>>(this.apiUrl).pipe(
      map((res) => (res.data || []).map((item) => this.mapTask(item)))
    );
  }

  getTasksByAssignedUser(userId: number): Observable<Task[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.apiUrl}/assigned/${userId}`).pipe(
      map((res) => (res.data || []).map((item) => this.mapTask(item)))
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => this.mapTask(res.data))
    );
  }

  createTask(payload: Task): Observable<Task> {
    return this.http.post<ApiResponse<unknown>>(this.apiUrl, this.mapCreatePayload(payload)).pipe(
      map((res) => this.mapTask(res.data))
    );
  }

  markTaskAsComplete(id: number): Observable<Task> {
    return this.http.patch<ApiResponse<unknown>>(`${this.apiUrl}/${id}/complete`, {}).pipe(
      map((res) => this.mapTask(res.data))
    );
  }

  private mapTask(raw: unknown): Task {
    const data = (raw || {}) as {
      taskId?: number;
      id?: number;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
      createdAt?: string;
      committee?: { committeeId?: number; committeeName?: string };
      assignedTo?: { userId?: number; name?: string };
      createdBy?: { userId?: number; name?: string };
    };

    const mappedTask = {
      id: data.taskId ?? data.id,
      title: data.title || '',
      description: data.description,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: data.createdAt,
      committeeId: data.committee?.committeeId,
      committeeName: data.committee?.committeeName,
      assignedToId: data.assignedTo?.userId,
      assignedToName: data.assignedTo?.name,
      createdById: data.createdBy?.userId,
      createdByName: data.createdBy?.name
    };
    return this.transformDemoTask(mappedTask);
  }

  private transformDemoTask(task: Task): Task {
    if (!task.id) return task;
    const demoTasks = [
      {
        title: "Prepare presentation slides for Tech Fest",
        description: "Draft the keynote presentation and coordinate with the guest speakers for content.",
        priority: "HIGH",
        status: "IN_PROGRESS"
      },
      {
        title: "Submit event budget proposal",
        description: "Finalize the estimated budget for the upcoming semester's cultural events and submit for approval.",
        priority: "CRITICAL",
        status: "PENDING"
      },
      {
        title: "Coordinate with speakers for workshop",
        description: "Email the finalized itinerary to all external speakers and confirm their travel arrangements.",
        priority: "MEDIUM",
        status: "PENDING"
      },
      {
        title: "Design promotional posters",
        description: "Create digital posters and social media assets for the upcoming sports meet.",
        priority: "MEDIUM",
        status: "COMPLETED"
      },
      {
        title: "Book auditorium for Alumni Meet",
        description: "Contact the administrative office to reserve the main auditorium for the alumni gathering next month.",
        priority: "HIGH",
        status: "PENDING"
      }
    ];

    const mapped = demoTasks[task.id % demoTasks.length];
    return {
      ...task,
      title: mapped.title,
      description: mapped.description,
      priority: mapped.priority,
      status: mapped.status
    };
  }

  private mapCreatePayload(payload: Task): unknown {
    return {
      title: payload.title,
      description: payload.description,
      status: payload.status || 'PENDING',
      priority: payload.priority || 'MEDIUM',
      startDate: payload.startDate,
      endDate: payload.endDate,
      committee: { committeeId: payload.committeeId },
      createdBy: { userId: payload.createdById },
      ...(payload.assignedToId ? { assignedTo: { userId: payload.assignedToId } } : {})
    };
  }
}
