import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Committee, CommitteeMembership, CreateCommitteeRequest, UpdateCommitteeRequest } from '../models/committee.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class CommitteeService {
  private readonly apiUrl = `${environment.apiUrl}/committees`;

  constructor(private http: HttpClient) {}

  getCommittees(): Observable<Committee[]> {
    return this.http.get<ApiResponse<unknown[]>>(this.apiUrl).pipe(
      map((res) => (res.data || []).map((item) => this.mapCommittee(item)))
    );
  }

  getCommitteeById(id: number): Observable<Committee> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => this.mapCommittee(res.data))
    );
  }

  createCommittee(request: CreateCommitteeRequest): Observable<Committee> {
    return this.http.post<ApiResponse<unknown>>(this.apiUrl, request).pipe(
      map((res) => this.mapCommittee(res.data))
    );
  }

  updateCommittee(id: number, request: UpdateCommitteeRequest): Observable<Committee> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/${id}`, request).pipe(
      map((res) => this.mapCommittee(res.data))
    );
  }

  deleteCommittee(id: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  applyForCommittee(committeeId: number, applicationMessage: string): Observable<CommitteeMembership> {
    return this.http.post<ApiResponse<unknown>>(`${environment.apiUrl}/committee/apply`, { committee_id: committeeId, application_message: applicationMessage }).pipe(
      map((res) => this.mapMembership(res.data))
    );
  }

  getMyMemberships(): Observable<CommitteeMembership[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${environment.apiUrl}/committee/my`).pipe(
      map((res) => (res.data || []).map((item) => this.mapMembership(item)))
    );
  }

  getCommitteeApplications(committeeId: number): Observable<CommitteeMembership[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${environment.apiUrl}/committee/applications/${committeeId}`).pipe(
      map((res) => (res.data || []).map((item) => this.mapMembership(item)))
    );
  }

  approveApplication(membershipId: number): Observable<CommitteeMembership> {
    return this.http.put<ApiResponse<unknown>>(`${environment.apiUrl}/committee/approve/${membershipId}`, {}).pipe(
      map((res) => this.mapMembership(res.data))
    );
  }

  rejectApplication(membershipId: number): Observable<CommitteeMembership> {
    return this.http.put<ApiResponse<unknown>>(`${environment.apiUrl}/committee/reject/${membershipId}`, {}).pipe(
      map((res) => this.mapMembership(res.data))
    );
  }

  private mapMembership(raw: unknown): CommitteeMembership {
    const data = (raw || {}) as {
      membershipId?: number;
      status?: string;
      appliedAt?: string;
      approvedAt?: string;
      user?: any;
      committee?: { committeeId?: number };
      roleInCommittee?: string;
      applicationMessage?: string;
      approvedBy?: any;
      updatedAt?: string;
    };

    return {
      membershipId: data.membershipId,
      status: (data.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING',
      appliedAt: data.appliedAt,
      approvedAt: data.approvedAt,
      userId: data.user?.userId || data.user?.id || 0,
      committeeId: data.committee?.committeeId || 0,
      user: data.user,
      roleInCommittee: data.roleInCommittee,
      applicationMessage: data.applicationMessage,
      approvedBy: data.approvedBy,
      updatedAt: data.updatedAt
    };
  }

  private mapCommittee(raw: unknown): Committee {
    const data = (raw || {}) as {
      committeeId?: number;
      id?: number;
      committeeID?: number;
      committee_id?: number;
      committeeName?: string;
      facultyInchargeName?: string;
      facultyPosition?: string;
      committeeInfo?: string;
      head?: { userId?: number };
      login?: { loginId?: number };
    };

    const idCandidate = data.committeeId ?? data.id ?? data.committeeID ?? data.committee_id;
    const resolvedId = Number(idCandidate);

    return {
      id: Number.isFinite(resolvedId) ? resolvedId : undefined,
      committeeName: data.committeeName || '',
      facultyInchargeName: data.facultyInchargeName,
      facultyPosition: data.facultyPosition,
      committeeInfo: data.committeeInfo,
      headId: data.head?.userId,
      loginId: data.login?.loginId
    };
  }
}
