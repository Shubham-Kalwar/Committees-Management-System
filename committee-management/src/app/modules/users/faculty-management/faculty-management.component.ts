import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { CommitteeService } from '../../../services/committee.service';
import { Committee } from '../../../models/committee.model';

@Component({
  selector: 'app-faculty-management',
  standalone: false,
  templateUrl: './faculty-management.component.html'
})
export class FacultyManagementComponent implements OnInit {
  facultyForm: FormGroup;
  submitting = false;
  committees: Committee[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private committeeService: CommitteeService,
    private notificationService: NotificationService
  ) {
    this.facultyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      committeeId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCommittees();
  }

  loadCommittees(): void {
    this.committeeService.getCommittees().subscribe({
      next: (data: Committee[]) => {
        this.committees = data;
      },
      error: (err: any) => console.error('Failed to load committees', err)
    });
  }

  onSubmit(): void {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.userService.createFaculty(this.facultyForm.value).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Success',
          message: 'Faculty created successfully',
          level: 'success'
        });
        this.facultyForm.reset();
        this.submitting = false;
      },
      error: (err: any) => {
        this.notificationService.add({
          title: 'Error',
          message: err?.error?.message || 'Failed to create faculty',
          level: 'error'
        });
        this.submitting = false;
      }
    });
  }
}
