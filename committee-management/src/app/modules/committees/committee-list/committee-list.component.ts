import { Component } from '@angular/core';
import { Committee, CommitteeMembership, CreateCommitteeRequest } from '../../../models/committee.model';
import { CommitteeService } from '../../../services/committee.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-committee-list',
  standalone: false,
  templateUrl: './committee-list.component.html',
  styleUrl: './committee-list.component.css'
})
export class CommitteeListComponent {
  committees: Committee[] = [];
  myMemberships: CommitteeMembership[] = [];
  isLoading = true;
  isApplying = false;
  errorMessage = '';
  activeView: 'ALL' | 'MY' = 'ALL';
  applyingCommitteeId: number | null = null;
  canApply = false;
  isAdmin = false;
  isFaculty = false;
  
  // Application modal state
  showApplicationModal = false;
  activeCommitteeForApplication: Committee | null = null;
  applicationMessage = '';

  // Admin CRUD modal state
  showCommitteeModal = false;
  committeeModalMode: 'create' | 'edit' = 'create';
  committeeForm: CreateCommitteeRequest = { committeeName: '', facultyInchargeName: '', facultyPosition: '', committeeInfo: '' };
  editingCommitteeId: number | null = null;
  isSavingCommittee = false;

  // Delete confirmation state
  showDeleteConfirm = false;
  deletingCommittee: Committee | null = null;
  isDeletingCommittee = false;

  constructor(
    private committeeService: CommitteeService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const role = this.authService.getCurrentRole();
    this.canApply = this.authService.isStudentRole();
    this.isAdmin = role === 'ADMIN';
    this.isFaculty = role === 'FACULTY';
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.committeeService.getCommittees().subscribe({
      next: (committees) => {
        this.committees = committees || [];
        if (this.canApply) {
          this.loadMyMemberships();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.committees = [];
        this.errorMessage = 'Unable to load committees right now. Please refresh and try again.';
      }
    });
  }

  loadMyMemberships(): void {
    this.committeeService.getMyMemberships().subscribe({
      next: (memberships) => {
        this.myMemberships = memberships || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get displayedCommittees(): Committee[] {
    if (this.activeView === 'ALL') {
      return this.committees;
    }
    const myCommitteeIds = this.myMemberships.map(m => m.committeeId);
    return this.committees.filter(c => myCommitteeIds.includes(c.id || 0));
  }

  setActiveView(view: 'ALL' | 'MY'): void {
    this.activeView = view;
  }

  getMembershipStatus(committeeId: number | undefined): string | null {
    if (!committeeId) return null;
    const membership = this.myMemberships.find(m => m.committeeId === committeeId);
    return membership ? membership.status : null;
  }

  // ─── Student Application Modal ───────────────────────────

  openApplicationModal(committee: Committee): void {
    if (!this.canApply) return;
    this.activeCommitteeForApplication = committee;
    this.applicationMessage = '';
    this.showApplicationModal = true;
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
    this.activeCommitteeForApplication = null;
    this.applicationMessage = '';
  }

  submitApplication(): void {
    const committeeId = this.activeCommitteeForApplication?.id;
    if (!committeeId || !this.canApply) return;

    this.isApplying = true;
    this.applyingCommitteeId = committeeId;
    const message = this.applicationMessage;
    
    this.committeeService.applyForCommittee(committeeId, message).subscribe({
      next: (membership) => {
        this.isApplying = false;
        this.applyingCommitteeId = null;
        this.myMemberships.push(membership);
        this.closeApplicationModal();
        this.notificationService.add({
          title: 'Application Submitted',
          message: 'Your application has been submitted and is pending approval.',
          level: 'success'
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isApplying = false;
        this.applyingCommitteeId = null;
        const msg = error.error?.message || 'Unable to submit application.';
        this.notificationService.add({
          title: 'Application Failed',
          message: msg,
          level: 'error'
        });
      }
    });
  }

  // ─── Admin CRUD ──────────────────────────────────────────

  openCreateModal(): void {
    this.committeeModalMode = 'create';
    this.editingCommitteeId = null;
    this.committeeForm = { committeeName: '', facultyInchargeName: '', facultyPosition: '', committeeInfo: '' };
    this.showCommitteeModal = true;
  }

  openEditModal(committee: Committee): void {
    this.committeeModalMode = 'edit';
    this.editingCommitteeId = committee.id || null;
    this.committeeForm = {
      committeeName: committee.committeeName || '',
      facultyInchargeName: committee.facultyInchargeName || '',
      facultyPosition: committee.facultyPosition || '',
      committeeInfo: committee.committeeInfo || ''
    };
    this.showCommitteeModal = true;
  }

  closeCommitteeModal(): void {
    this.showCommitteeModal = false;
    this.editingCommitteeId = null;
    this.committeeForm = { committeeName: '', facultyInchargeName: '', facultyPosition: '', committeeInfo: '' };
  }

  saveCommittee(): void {
    if (!this.committeeForm.committeeName?.trim()) return;

    this.isSavingCommittee = true;

    if (this.committeeModalMode === 'create') {
      this.committeeService.createCommittee(this.committeeForm).subscribe({
        next: (committee) => {
          this.isSavingCommittee = false;
          this.committees.push(committee);
          this.closeCommitteeModal();
          this.notificationService.add({ title: 'Created', message: `${committee.committeeName} has been created.`, level: 'success' });
        },
        error: (err: HttpErrorResponse) => {
          this.isSavingCommittee = false;
          this.notificationService.add({ title: 'Creation Failed', message: err.error?.message || 'Unable to create committee.', level: 'error' });
        }
      });
    } else if (this.editingCommitteeId) {
      this.committeeService.updateCommittee(this.editingCommitteeId, this.committeeForm).subscribe({
        next: (updated) => {
          this.isSavingCommittee = false;
          const idx = this.committees.findIndex(c => c.id === this.editingCommitteeId);
          if (idx !== -1) this.committees[idx] = updated;
          this.closeCommitteeModal();
          this.notificationService.add({ title: 'Updated', message: `${updated.committeeName} has been updated.`, level: 'success' });
        },
        error: (err: HttpErrorResponse) => {
          this.isSavingCommittee = false;
          this.notificationService.add({ title: 'Update Failed', message: err.error?.message || 'Unable to update committee.', level: 'error' });
        }
      });
    }
  }

  openDeleteConfirm(committee: Committee): void {
    this.deletingCommittee = committee;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.deletingCommittee = null;
  }

  confirmDelete(): void {
    const id = this.deletingCommittee?.id;
    if (!id) return;

    this.isDeletingCommittee = true;
    this.committeeService.deleteCommittee(id).subscribe({
      next: () => {
        this.isDeletingCommittee = false;
        this.committees = this.committees.filter(c => c.id !== id);
        this.closeDeleteConfirm();
        this.notificationService.add({ title: 'Deleted', message: 'Committee has been deleted.', level: 'success' });
      },
      error: (err: HttpErrorResponse) => {
        this.isDeletingCommittee = false;
        this.notificationService.add({ title: 'Delete Failed', message: err.error?.message || 'Unable to delete committee.', level: 'error' });
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────

  getCommitteeRouteId(committee: Committee): number | null {
    const id = Number(committee?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  getCommitteeDescription(committee: Committee): string {
    const info = (committee?.committeeInfo || '').trim();
    if (!info) {
      return 'Committee details will be available soon.';
    }

    if (info.length <= 120) {
      return info;
    }

    return `${info.slice(0, 120)}...`;
  }

}
