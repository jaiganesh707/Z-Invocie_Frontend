import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, registerables, Chart } from 'chart.js';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
    selector: 'app-analytics-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './analytics-dashboard.component.html',
    styles: [`
    .analytics-card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: 28px;
      padding: 2.5rem;
      height: 100%;
      box-shadow: var(--glass-inner-glow), var(--shadow-premium);
    }
    .stats-value {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .chart-container {
      position: relative;
      height: 450px;
      width: 100%;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
    period = signal<string>('day');
    userId = signal<number | undefined>(undefined);
    performanceData: any[] = [];
    isLoading = true;
    private destroy$ = new Subject<void>();

    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Stakeholder Net Profit (₹)',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16, 185, 129, 0.6)';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(6, 78, 59, 0.4)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
                    return gradient;
                },
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 15,
                hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
                barThickness: 40
            }
        ]
    };

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Outfit', size: 14, weight: 'bold' },
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                titleFont: { family: 'Outfit', size: 16, weight: 'bold' },
                bodyColor: '#10b981',
                bodyFont: { family: 'Outfit', size: 14 },
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 15,
                cornerRadius: 12,
                displayColors: false
            }
        },
        scales: {
            y: {
                ticks: { color: '#64748b', font: { family: 'Outfit' } },
                grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false }
            },
            x: {
                ticks: { color: '#94a3b8', font: { family: 'Outfit', weight: 'bold' } },
                grid: { display: false }
            }
        },
        animation: {
            duration: 2500,
            easing: 'easeOutQuart'
        }
    };

    public barChartType: ChartType = 'bar';

    constructor(
        private route: ActivatedRoute,
        private analyticsService: AnalyticsService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.fetchPerformance();

        // Polling every 30 seconds
        interval(30000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.fetchPerformance(false));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fetchPerformance(showLoading = true) {
        if (showLoading) this.isLoading = true;
        this.analyticsService.getStakeholderPerformance()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.performanceData = data;
                    this.updateChart();
                    this.isLoading = false;
                },
                error: (err) => {
                    this.toastService.show('Failed to fetch performance analytics', 'error');
                    this.isLoading = false;
                }
            });
    }

    updateChart() {
        this.barChartData.labels = this.performanceData.map(d => d.username);
        this.barChartData.datasets[0].data = this.performanceData.map(d => d.profit);
    }
}
