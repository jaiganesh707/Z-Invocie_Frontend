import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
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
export class UserAnalyticsComponent implements OnInit, OnDestroy {
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

  constructor(
    private route: ActivatedRoute,
    private analyticsService: AnalyticsService
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

  fetchAnalytics(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    this.analyticsService.getBillingAnalytics(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.isLoading = false;
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
          backgroundColor: 'rgba(74, 137, 232, 0.7)',
          borderColor: 'rgba(74, 137, 232, 1)',
          borderWidth: 1,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(74, 137, 232, 0.9)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { ticks: { color: '#fff' } },
          x: { ticks: { color: '#fff' } }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutElastic'
        }
      }
    });

    // Pie Chart - Revenue Distribution
    this.chart2 = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: revenues,
          backgroundColor: [
            '#4a89e8', '#45b7af', '#ff9f40', '#ff6384', '#9966ff', '#ffcd56'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff' } }
        },
        cutout: '70%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000
        }
      }
    });

    // Expense Chart - Expense Distribution
    const expenseLabels = this.analyticsData.expenseStats.map((s: any) => s.category);
    const expenseAmounts = this.analyticsData.expenseStats.map((s: any) => s.amount);

    this.chart3 = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: expenseLabels,
        datasets: [{
          data: expenseAmounts,
          backgroundColor: [
            '#ef4444', '#f97316', '#facc15', '#a855f7', '#ec4899', '#64748b'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff' } }
        },
        cutout: '70%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000
        }
      }
    });
  }
}
