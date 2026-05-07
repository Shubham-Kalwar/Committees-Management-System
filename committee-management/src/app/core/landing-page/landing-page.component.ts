import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Committee } from '../../models/committee.model';
import { Event } from '../../models/event.model';
import { CommitteeService } from '../../services/committee.service';
import { EventService } from '../../services/event.service';
import { catchError, of } from 'rxjs';
import { ApiResponse } from '../../models/auth.model';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  @ViewChildren('animatedSection') animatedSections!: QueryList<ElementRef>;

  // Live stats from API
  totalCommittees = 0;
  totalEvents = 0;
  totalUsers = 0;
  statsLoaded = false;

  // Dynamic data
  committees: Committee[] = [];
  events: Event[] = [];
  committeesLoading = true;
  eventsLoading = true;

  // Features — real system capabilities
  features = [
    {
      icon: 'groups',
      title: 'Committee Management',
      text: 'Create, organize, and manage academic committees with role-based member management and faculty oversight.',
      route: '/auth/register'
    },
    {
      icon: 'event',
      title: 'Event Registration',
      text: 'Full event lifecycle with student registration, faculty approval workflows, and automated status tracking.',
      route: '/auth/register'
    },
    {
      icon: 'qr_code_scanner',
      title: 'QR Attendance',
      text: 'Generate session QR codes for instant digital attendance capture with real-time verification.',
      route: '/auth/register'
    },
    {
      icon: 'task_alt',
      title: 'Task Management',
      text: 'Assign tasks to committee members with priority levels, deadlines, and completion tracking.',
      route: '/auth/register'
    },
    {
      icon: 'campaign',
      title: 'Announcements',
      text: 'Broadcast targeted announcements to committees, events, or the entire campus with read tracking.',
      route: '/auth/register'
    },
    {
      icon: 'photo_library',
      title: 'Media Gallery',
      text: 'Upload event photos and videos with organized galleries, lightbox previews, and role-based access.',
      route: '/auth/register'
    }
  ];

  // How it works steps
  steps = [
    { icon: 'group_add', title: 'Create or Join', description: 'Create a committee or apply to join an existing one.' },
    { icon: 'event_available', title: 'Register for Events', description: 'Browse upcoming events and submit your registration.' },
    { icon: 'verified', title: 'Get Approved', description: 'Faculty reviews and approves your registration request.' },
    { icon: 'qr_code_2', title: 'Scan QR', description: 'Attend the event and scan the QR code for instant attendance.' },
    { icon: 'insights', title: 'Track Progress', description: 'Monitor participation, feedback, and performance analytics.' }
  ];

  currentYear = new Date().getFullYear();

  constructor(
    private http: HttpClient,
    private committeeService: CommitteeService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadCommittees();
    this.loadEvents();
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
  }

  private loadStats(): void {
    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/stats`)
      .pipe(catchError(() => of({ data: {} } as any)))
      .subscribe((res) => {
        const data = res?.data || {};
        this.totalCommittees = data.totalCommittees || 0;
        this.totalEvents = data.totalEvents || 0;
        this.totalUsers = data.totalUsers || 0;
        this.statsLoaded = true;
      });
  }

  private loadCommittees(): void {
    this.committeesLoading = true;
    this.committeeService.getCommittees()
      .pipe(catchError(() => of([] as Committee[])))
      .subscribe((committees) => {
        this.committees = (committees || []).slice(0, 4);
        this.committeesLoading = false;
      });
  }

  private loadEvents(): void {
    this.eventsLoading = true;
    this.eventService.getEvents()
      .pipe(catchError(() => of([] as Event[])))
      .subscribe((events) => {
        this.events = (events || []).slice(0, 4);
        this.eventsLoading = false;
      });
  }

  formatDate(value: string | undefined): string {
    if (!value) return 'TBA';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status: string | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'UPCOMING') return 'status-active';
    if (s === 'COMPLETED') return 'status-completed';
    if (s === 'CANCELLED') return 'status-cancelled';
    return 'status-default';
  }

  private setupScrollAnimations(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    setTimeout(() => {
      this.animatedSections?.forEach((el) => {
        el.nativeElement.classList.add('animate-on-scroll');
        observer.observe(el.nativeElement);
      });
    }, 50);
  }
}
