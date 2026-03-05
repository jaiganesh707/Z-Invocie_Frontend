import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { DataCacheService } from '../../services/data-cache.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-analytics.html',
  styleUrl: './user-analytics.css',
})
export class UserAnalyticsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('barChart') barChartCanvas!: ElementRef;
  @ViewChild('pieChart') pieChartCanvas!: ElementRef;
  @ViewChild('expenseChart') expenseChartCanvas!: ElementRef;

  @Input() inputUserId?: number;

  userId!: number;
  analyticsData: any;
  isLoading = true;
  private destroy$ = new Subject<void>();

  chart1: any;
  chart2: any;
  chart3: any;
  chart4: any;

  constructor(
    private route: ActivatedRoute,
    private analyticsService: AnalyticsService,
    private cacheService: DataCacheService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.inputUserId) {
      this.userId = this.inputUserId;
    } else {
      this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    }
    this.fetchAnalytics();

    // Polling every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fetchAnalytics(false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputUserId'] && !changes['inputUserId'].firstChange) {
      this.userId = changes['inputUserId'].currentValue;
      this.fetchAnalytics();
    }
  }

  refreshData(): void {
    const cacheKey = `analytics_billing_${this.userId}`;
    this.cacheService.clear(cacheKey);
    this.fetchAnalytics(true);
  }

  fetchAnalytics(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    this.analyticsService.getBillingAnalytics(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.isLoading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.initCharts(), 0);
        },
        error: (err) => {
          console.error('Error fetching analytics:', err);
          this.isLoading = false;
        }
      });
  }

  initCharts(): void {
    if (!this.analyticsData) return;

    if (this.chart1) this.chart1.destroy();
    if (this.chart2) this.chart2.destroy();
    if (this.chart3) this.chart3.destroy();
    if (this.chart4) this.chart4.destroy();

    const ctx1 = this.barChartCanvas.nativeElement.getContext('2d');
    const ctx2 = this.pieChartCanvas.nativeElement.getContext('2d');
    const ctx3 = this.expenseChartCanvas.nativeElement.getContext('2d');

    const labels = this.analyticsData.productSalesStats.map((s: any) => s.productName);
    const quantities = this.analyticsData.productSalesStats.map((s: any) => s.quantity);
    const revenues = this.analyticsData.productSalesStats.map((s: any) => s.revenue);

    // Bar Chart - Sales Quantity
    this.chart1 = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantity Sold',
          data: quantities,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.8)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(255,255,255,0.5)' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.8)' },
            grid: { display: false }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });

    // Doughnut Chart - Revenue Distribution
    this.chart2 = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: revenues,
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(139, 92, 246, 0.7)'
          ],
          borderWidth: 0,
          hoverOffset: 20
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(255,255,255,0.7)',
              usePointStyle: true,
              padding: 20,
              font: { size: 12 }
            }
          }
        },
        cutout: '75%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000
        }
      }
    });

    // Expense Chart
    const expenseLabels = this.analyticsData.expenseStats.map((s: any) => s.category);
    const expenseAmounts = this.analyticsData.expenseStats.map((s: any) => s.amount);

    this.chart3 = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: expenseLabels,
        datasets: [{
          data: expenseAmounts,
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(250, 204, 21, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)'
          ],
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.7)',
              usePointStyle: true,
              padding: 15
            }
          }
        },
        cutout: '75%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000
        }
      }
    });

    // Initialize Prediction Logic if needed for visualization
    if (this.analyticsData.predictions && this.analyticsData.predictions.length > 0) {
      // We could add a prediction trend line chart here if needed
    }
  }

  getAdvantageIcon(type: string): string {
    switch (type) {
      case 'Fast Mover': return 'bi-lightning-charge-fill';
      case 'Revenue Driver': return 'bi-cash-stack';
      case 'High Margin': return 'bi-bank';
      case 'Growth Leader': return 'bi-graph-up-arrow';
      default: return 'bi-award';
    }
  }

  getTrendClass(trend: string): string {
    return trend === 'UP' ? 'text-emerald' : 'text-muted';
  }
}
