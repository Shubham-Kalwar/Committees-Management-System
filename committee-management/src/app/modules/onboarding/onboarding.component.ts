import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { Event as EventModel } from '../../models/event.model';
import { MyProfileResponse } from '../../models/auth.model';

type OnboardingStep = 1 | 2 | 3;

interface InterestOption {
  label: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-onboarding',
  standalone: false,
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent implements OnInit {
  currentStep: OnboardingStep = 1;
  profileForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  profilePhotoPreview: string | null = null;
  profilePhotoFile: File | null = null;

  suggestedEvents: EventModel[] = [];
  isLoadingEvents = false;

  readonly departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Mathematics',
    'Physics',
    'Commerce',
    'Arts & Humanities',
    'Management',
    'Other'
  ];

  readonly years = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Post Graduate'
  ];

  readonly interestOptions: InterestOption[] = [
    { label: 'Technology', icon: 'computer', selected: false },
    { label: 'Sports', icon: 'sports_soccer', selected: false },
    { label: 'Cultural', icon: 'palette', selected: false },
    { label: 'Academic', icon: 'school', selected: false },
    { label: 'Social Service', icon: 'volunteer_activism', selected: false },
    { label: 'Music', icon: 'music_note', selected: false },
    { label: 'Photography', icon: 'photo_camera', selected: false },
    { label: 'Debate', icon: 'forum', selected: false },
    { label: 'Entrepreneurship', icon: 'rocket_launch', selected: false },
    { label: 'Coding', icon: 'code', selected: false },
    { label: 'Design', icon: 'brush', selected: false },
    { label: 'Literature', icon: 'menu_book', selected: false }
  ];

  private profile: MyProfileResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      department: [null, Validators.required],
      year: [null, [Validators.required, (control: any) => this.years.includes(control.value) ? null : { invalidYear: true }]]
    });

    // Load current profile data
    this.authService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        if (profile.name) {
          this.profileForm.patchValue({ name: profile.name });
        }
        if (profile.department) {
          this.profileForm.patchValue({ department: profile.department });
        }
        if (profile.year) {
          this.profileForm.patchValue({ year: profile.year });
        }
        if (profile.photoDataUrl) {
          this.profilePhotoPreview = profile.photoDataUrl;
        }
        if (profile.isOnboarded) {
          // Already onboarded, redirect
          this.router.navigate([this.authService.getRoleHomeRoute()]);
        }
      }
    });
  }

  get selectedInterests(): string[] {
    return this.interestOptions
      .filter((option) => option.selected)
      .map((option) => option.label);
  }

  get progressPercentage(): number {
    return Math.round((this.currentStep / 3) * 100);
  }

  get canProceedFromStep1(): boolean {
    return this.profileForm.valid;
  }

  get canProceedFromStep2(): boolean {
    return true; // interests are optional
  }

  toggleInterest(option: InterestOption): void {
    option.selected = !option.selected;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Photo must be less than 2MB';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select an image file';
      return;
    }

    this.profilePhotoFile = file;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = () => {
      this.profilePhotoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.profilePhotoPreview = null;
    this.profilePhotoFile = null;
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.canProceedFromStep1) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (this.currentStep === 2) {
      this.loadSuggestedEvents();
    }

    if (this.currentStep < 3) {
      this.currentStep = (this.currentStep + 1) as OnboardingStep;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep = (this.currentStep - 1) as OnboardingStep;
    }
  }

  skipStep(): void {
    if (this.currentStep === 2) {
      this.loadSuggestedEvents();
      this.currentStep = 3;
    } else if (this.currentStep === 3) {
      this.completeOnboarding();
    }
  }

  completeOnboarding(): void {
    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      name: this.profileForm.value.name?.trim(),
      department: this.profileForm.value.department,
      year: this.profileForm.value.year,
      interests: this.selectedInterests
    };

    // Upload photo first if selected
    if (this.profilePhotoFile) {
      this.authService.uploadMyProfilePhoto(this.profilePhotoFile).subscribe({
        next: () => {
          this.submitOnboarding(payload);
        },
        error: () => {
          // Continue even if photo upload fails
          this.submitOnboarding(payload);
        }
      });
    } else {
      this.submitOnboarding(payload);
    }
  }

  private submitOnboarding(payload: { name?: string; department?: string; year?: string; interests?: string[] }): void {
    this.authService.completeOnboarding(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.authService.clearOnboardingCache();
        this.router.navigate([this.authService.getRoleHomeRoute()]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  private loadSuggestedEvents(): void {
    if (this.suggestedEvents.length > 0) {
      return; // Already loaded
    }

    this.isLoadingEvents = true;
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.suggestedEvents = events.slice(0, 6);
        this.isLoadingEvents = false;
      },
      error: () => {
        this.suggestedEvents = [];
        this.isLoadingEvents = false;
      }
    });
  }

  registerForEvent(eventModel: EventModel): void {
    if (!this.profile?.userId) {
      return;
    }

    this.eventService.registerForEvent(Number(eventModel.id), this.profile.userId).subscribe({
      next: () => {
        // Mark as registered in UI
        (eventModel as EventModel & { registered?: boolean }).registered = true;
      },
      error: () => {
        // Silently fail — user can register later
      }
    });
  }

  isEventRegistered(eventModel: EventModel): boolean {
    return !!(eventModel as EventModel & { registered?: boolean }).registered;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Set Up Your Profile';
      case 2:
        return 'Select Your Interests';
      case 3:
        return 'Discover Events';
      default:
        return '';
    }
  }

  getStepSubtitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Tell us a bit about yourself so we can personalize your experience';
      case 2:
        return 'Choose topics you\'re passionate about to get relevant recommendations';
      case 3:
        return 'Here are some upcoming events you might enjoy';
      default:
        return '';
    }
  }
}
