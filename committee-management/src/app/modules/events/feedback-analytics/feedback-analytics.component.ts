import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FeedbackAnalytics } from '../../../models/event-feedback.model';
import { FeedbackService } from '../../../services/feedback.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-feedback-analytics',
  standalone: false,
  templateUrl: './feedback-analytics.component.html',
  styleUrl: './feedback-analytics.component.css'
})
export class FeedbackAnalyticsComponent implements OnInit {
  @Input() eventId!: number;

  analytics: FeedbackAnalytics | null = null;
  loading = true;
  errorMessage = '';
  chart: Chart | null = null;

  readonly stars = [1, 2, 3, 4, 5];

  @ViewChild('distributionChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    if (!this.eventId) return;
    this.loading = true;
    this.errorMessage = '';

    this.feedbackService.getAnalytics(this.eventId).subscribe({
      next: (data) => {
        this.loading = false;
        this.analytics = data;
        // Wait for view to update before rendering chart
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load analytics.';
      }
    });
  }

  get averageDisplay(): string {
    return this.analytics?.averageRating?.toFixed(1) || '0.0';
  }

  get totalResponses(): number {
    return this.analytics?.totalResponses || 0;
  }

  isStarFilled(star: number): boolean {
    return star <= Math.round(this.analytics?.averageRating || 0);
  }

  getDistributionPercentage(rating: number): number {
    if (!this.analytics?.ratingDistribution || !this.totalResponses) return 0;
    const count = this.analytics.ratingDistribution[rating] || 0;
    return Math.round((count / this.totalResponses) * 100);
  }

  getDistributionCount(rating: number): number {
    return this.analytics?.ratingDistribution?.[rating] || 0;
  }

  private renderChart(): void {
    if (!this.chartRef?.nativeElement || !this.analytics) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const dist = this.analytics.ratingDistribution || {};
    const labels = ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'];
    const data = [1, 2, 3, 4, 5].map(r => dist[r] || 0);
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Responses',
          data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} response${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 12, weight: 'bold' },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              stepSize: 1,
              font: { size: 11 },
              color: '#94a3b8'
            }
          }
        }
      }
    });
  }
}
