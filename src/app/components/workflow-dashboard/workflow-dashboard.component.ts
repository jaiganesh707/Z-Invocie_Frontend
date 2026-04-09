import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { StorageService } from '../../services/storage.service';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-workflow-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workflow-dashboard.component.html',
  styleUrls: ['./workflow-dashboard.component.css']
})
export class WorkflowDashboardComponent implements OnInit {
  invoices: Invoice[] = [];
  isLoading = true;
  userId: number = 0;
  username: string = '';
  uniqueKey: string = '';
  role: string = '';

  constructor(
    private invoiceService: InvoiceService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.storageService.getUser();
    if (user) {
      this.userId = user.id;
      this.username = user.username;
      this.uniqueKey = user.uniqueCode || '';
      this.role = user.role || '';
    }
    this.loadInvoices();
  }

  loadInvoices(): void {
    // Determine the root business group owner (the Prime User)
    const rootPrimeId = this.userId; // Default to self if no parent
    const effectiveAdminId = this.storageService.getUser()?.parentUserId || rootPrimeId;

    this.isLoading = true;
    this.invoiceService.getByUser(effectiveAdminId).subscribe({
      next: (data) => {
        // Dashboard should reflect THIS specific worker's activity
        this.invoices = data.filter(inv => 
          (inv.createdBy && inv.createdBy.id === this.userId) || 
          (inv.creatorEmployeeId === this.userId)
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get totalInvoices(): number { return this.invoices.length; }

  get approvedCount(): number {
    return this.invoices.filter(i => i.status === 'APPROVED').length;
  }

  get pendingCount(): number {
    return this.invoices.filter(i => i.status === 'PENDING_APPROVAL').length;
  }

  get totalAmount(): number {
    return this.invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  }

  get recentInvoices(): Invoice[] {
    return [...this.invoices].sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    ).slice(0, 8);
  }

  deleteInvoice(id: number): void {
    if (!confirm('Remove this invoice from your record?')) return;
    this.invoiceService.delete(id).subscribe({
      next: () => {
        this.invoices = this.invoices.filter(i => i.id !== id);
      },
      error: (err) => alert('Delete failed: ' + (err.error?.message || 'Unknown error'))
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/create-invoice']);
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'PENDING': return 'status-pending';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-draft';
    }
  }
}
