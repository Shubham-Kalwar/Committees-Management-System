import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Committee } from '../../../models/committee.model';
import { CommitteeService } from '../../../services/committee.service';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-committee-detail',
  standalone: false,
  templateUrl: './committee-detail.component.html',
  styleUrl: './committee-detail.component.css'
})
export class CommitteeDetailComponent {
  committee?: Committee;
  loading = true;
  errorMessage = '';
  requestedCommitteeId?: number;
  
  isApprovedMember = false;
  isStudent = false;

  constructor(
    private route: ActivatedRoute, 
    private committeeService: CommitteeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.loading = true;
      this.errorMessage = '';
      this.committee = undefined;

      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.loading = false;
        this.errorMessage = 'Invalid committee identifier.';
        return;
      }

      this.requestedCommitteeId = id;
      this.isStudent = this.authService.isStudentRole();
      
      this.committeeService.getCommitteeById(id).subscribe({
        next: (committee) => {
          this.committee = committee || undefined;
          if (!this.committee) {
            this.errorMessage = 'Committee not found.';
            this.loading = false;
            return;
          }

          if (this.isStudent) {
            this.checkMembershipAccess(id);
          } else {
            this.isApprovedMember = true; // Non-students have access
            this.loading = false;
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Unable to load committee details right now.';
        }
      });
    });
  }

  private checkMembershipAccess(committeeId: number): void {
    this.committeeService.getMyMemberships().subscribe({
      next: (memberships) => {
        const membership = memberships?.find(m => m.committeeId === committeeId);
        this.isApprovedMember = membership?.status === 'APPROVED';
        this.loading = false;
      },
      error: () => {
        this.isApprovedMember = false;
        this.loading = false;
      }
    });
  }

}
