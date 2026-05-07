import { Component, OnInit } from '@angular/core';
import { Committee, CommitteeMembership } from '../../../models/committee.model';
import { CommitteeService } from '../../../services/committee.service';
import { NotificationService } from '../../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-committee-applications',
  standalone: false,
  templateUrl: './committee-applications.component.html'
})
export class CommitteeApplicationsComponent implements OnInit {
  committees: Committee[] = [];
  selectedCommitteeId: number | null = null;
  applications: CommitteeMembership[] = [];
  
  isLoadingCommittees = true;
  isLoadingApplications = false;
  processingMembershipId: number | null = null;

  constructor(
    private committeeService: CommitteeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCommittees();
  }

  loadCommittees(): void {
    this.isLoadingCommittees = true;
    this.committeeService.getCommittees().subscribe({
      next: (committees) => {
        this.committees = committees || [];
        this.isLoadingCommittees = false;
        
        // Auto-select the first committee if available
        if (this.committees.length > 0 && this.committees[0].id) {
          this.selectCommittee(this.committees[0].id);
        }
      },
      error: () => {
        this.isLoadingCommittees = false;
        this.notificationService.add({
          title: 'Error',
          message: 'Unable to load committees.',
          level: 'error'
        });
      }
    });
  }

  selectCommittee(committeeId: number): void {
    this.selectedCommitteeId = committeeId;
    this.loadApplications();
  }

  loadApplications(): void {
    if (!this.selectedCommitteeId) return;

    this.isLoadingApplications = true;
    this.committeeService.getCommitteeApplications(this.selectedCommitteeId).subscribe({
      next: (applications) => {
        this.applications = applications || [];
        this.isLoadingApplications = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingApplications = false;
        this.applications = [];
        // Optional: silently fail or show error if they select a committee they don't own
      }
    });
  }

  approveApplication(membershipId: number | undefined): void {
    if (!membershipId) return;
    this.processingMembershipId = membershipId;
    
    this.committeeService.approveApplication(membershipId).subscribe({
      next: (updated) => {
        this.processingMembershipId = null;
        const index = this.applications.findIndex(a => a.membershipId === membershipId);
        if (index !== -1) {
          this.applications[index] = updated;
        }
        this.notificationService.add({ title: 'Approved', message: 'Application approved successfully.', level: 'success' });
      },
      error: (err: HttpErrorResponse) => {
        this.processingMembershipId = null;
        this.notificationService.add({ title: 'Approval Failed', message: err.error?.message || 'Unauthorized or unable to approve.', level: 'error' });
      }
    });
  }

  rejectApplication(membershipId: number | undefined): void {
    if (!membershipId) return;
    this.processingMembershipId = membershipId;
    
    this.committeeService.rejectApplication(membershipId).subscribe({
      next: (updated) => {
        this.processingMembershipId = null;
        const index = this.applications.findIndex(a => a.membershipId === membershipId);
        if (index !== -1) {
          this.applications[index] = updated;
        }
        this.notificationService.add({ title: 'Rejected', message: 'Application rejected.', level: 'success' });
      },
      error: (err: HttpErrorResponse) => {
        this.processingMembershipId = null;
        this.notificationService.add({ title: 'Rejection Failed', message: err.error?.message || 'Unauthorized or unable to reject.', level: 'error' });
      }
    });
  }

  get pendingApplications(): CommitteeMembership[] {
    return this.applications.filter(a => a.status === 'PENDING');
  }

  get reviewedApplications(): CommitteeMembership[] {
    return this.applications.filter(a => a.status !== 'PENDING');
  }
}
