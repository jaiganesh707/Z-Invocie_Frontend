import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { DriverService, DriverDetails } from '../../services/driver.service';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-approval-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approval-terminal.component.html',
  styleUrl: './approval-terminal.component.css'
})
export class ApprovalTerminalComponent implements OnInit {
  activeTab: 'current' | 'prev' | 'pendingTab' = 'current';
  filterDate: string = '';
  allPendingInvoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  isLoading = true;
  selectedInvoice: Invoice | null = null;
  rejectionReason = '';
  isRejecting = false;
  currentCustomerBalance: number = 0;
  today = new Date();
  availableDrivers: DriverDetails[] = [];
  selectedDriverUserId: number | null = null;
  addOutstanding = false;
  paidAmount: number = 0;
  selectedInvoiceForModal: Invoice | null = null;

  constructor(
    private invoiceService: InvoiceService,
    private driverService: DriverService,
    private customerService: CustomerService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.fetchPendingInvoices();
      this.fetchAvailableDrivers();
    }, 100);
  }

  payCustomerPending(dateKey: string, amount: number): void {
    if (!this.selectedInvoice?.customer?.id) return;

    if (confirm(`Acknowledge payment of ₹${amount} for legacy debt logged on ${dateKey}?`)) {
      this.customerService.payPendingAmount(this.selectedInvoice.customer.id, dateKey).subscribe({
        next: () => {
          this.toastService.success(`₹${amount} legacy debt settled from stakeholder ledger.`);
          // RECENT POLICY: Manual settlements are handled via separate transaction. 
          // Do not add to current invoice's paidAmount to avoid double-reduction of the bill.

          this.invoiceService.getCustomerBalance(this.selectedInvoice!.customer!.id!).subscribe({
            next: (balance) => {
              this.currentCustomerBalance = balance;

              // Full Deep Sync: Refresh the customer object to clear the history UI
              this.customerService.getByUser(this.selectedInvoice!.user!.id!).subscribe({
                next: (customers: any[]) => {
                  const updatedCust = customers.find(c => c.id === this.selectedInvoice!.customer!.id);
                  if (updatedCust && this.selectedInvoice) {
                    this.selectedInvoice.customer = updatedCust;
                  }
                  this.cdr.detectChanges();
                }
              });
            }
          });
        },
        error: () => {
          this.toastService.error('Failed to settle ledger history');
          this.cdr.detectChanges();
        }
      });
    }
  }

  fetchAvailableDrivers(): void {
    this.driverService.getByParent().subscribe({
      next: (data: DriverDetails[]) => {
        this.availableDrivers = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Failed to retrieve driver nodes');
        this.cdr.detectChanges();
      }
    });
  }

  fetchPendingInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getPending().subscribe({
      next: (data: Invoice[]) => {
        this.allPendingInvoices = data.filter(inv =>
          ['CREATED', 'PENDING', 'PENDING_APPROVAL'].includes(inv.status ?? ''));
        console.log(`#### QUEUE SYNC: ${this.allPendingInvoices.length} actionable invoices loaded`);

        this.applyFilters();
        this.isLoading = false;

        // Auto-select first item if available
        if (this.filteredInvoices.length > 0) {
          this.viewDetails(this.filteredInvoices[0]);
        } else {
          this.selectedInvoice = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Failed to synchronize with approval queue');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const todayStr = new Date().toDateString();

    switch (this.activeTab) {

      // ── CURRENT: today's invoices awaiting first approval ─────────────────
      case 'current':
        this.filteredInvoices = this.allPendingInvoices.filter(inv => {
          console.log('Checking:', inv.status, inv.createdAt);
          const isActionable = ['CREATED'].includes(inv.status ?? '');

          const now = new Date();
          const last12hrs = new Date(now.getTime() - 12 * 60 * 60 * 1000);

          const createdToday = inv.createdAt
          ? new Date(inv.createdAt) >= last12hrs
          : false;
          console.log('Result:', isActionable, createdToday);
          return isActionable && createdToday;
        });
        break;  

      // ── PREVIOUS: older invoices still awaiting approval ──────────────────
      case 'prev':
        this.filteredInvoices = this.allPendingInvoices.filter(inv => {
          const isActionable = ['CREATED', 'PENDING_APPROVAL'].includes(inv.status ?? '');
          if (!isActionable) return false;

          if (this.filterDate) {
            // Specific date selected by the approver
            const invIso = inv.createdAt
              ? new Date(inv.createdAt).toISOString().split('T')[0]
              : '';
            return invIso === this.filterDate;
          }

          // Default: everything older than today
          const createdToday = inv.createdAt
            ? new Date(inv.createdAt).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
            : false;
          return !createdToday;
        });
        break;

      // ── PENDING TAB: partial-payment holding queue ─────────────────────────
      case 'pendingTab':
        this.filteredInvoices = this.allPendingInvoices.filter(inv =>
          inv.status === 'PENDING'
        );
        break;
    }

    this.cdr.detectChanges();
  }



  setTab(tab: 'current' | 'prev' | 'pendingTab'): void {
    this.activeTab = tab;
    this.filterDate = '';       // Reset date picker when switching tabs
    this.applyFilters();

    if (this.filteredInvoices.length > 0) {
      this.viewDetails(this.filteredInvoices[0]);
    } else {
      this.selectedInvoice = null;
    }
  }



  get effectiveTotalAmount(): number {
    const invoice = this.selectedInvoice || this.selectedInvoiceForModal;
    if (!invoice) return 0;
    let total = invoice.totalAmount;
    return total;
  }

  
  //Badges ->
  getCurrentCount(): number {
  const now = new Date();
  const last12hrs = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  return this.allPendingInvoices.filter(inv =>
    inv.status === 'CREATED' &&
    inv.createdAt &&
    new Date(inv.createdAt) >= last12hrs
    ).length;
  }

  getPreviousCount(): number {
    return this.allPendingInvoices.filter(inv =>
      ['CREATED', 'PENDING_APPROVAL'].includes(inv.status ?? '') &&
      inv.createdAt &&
      new Date(inv.createdAt).toDateString() !== new Date().toDateString()
    ).length;
  }

  getPendingCount(): number {
    return this.allPendingInvoices.filter(inv =>
      inv.status === 'PENDING'
    ).length;
  }

  viewDetails(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.isRejecting = false;
    this.currentCustomerBalance = 0;
    this.paidAmount = invoice.paidAmount || 0;
    if (invoice.customer && invoice.customer.id) {
      this.invoiceService.getCustomerBalance(invoice.customer.id).subscribe({
        next: (balance) => {
          this.currentCustomerBalance = balance;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error('Failed to retrieve stakeholder balance');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }

  hasPendingHistory(): boolean {
    const history = this.selectedInvoice?.customer?.pendingHistory;
    return history ? Object.keys(history).length > 0 : false;
  }

  payFull(): void {
    if (this.selectedInvoice) {
      // Powerful Macro: If there's outstanding, assume user wants to pay that too
      if (this.currentCustomerBalance > 0 && !this.addOutstanding) {
        this.addOutstanding = true;
      }
      this.paidAmount = this.effectiveTotalAmount;
      this.toastService.show('Full settlement calculated and synchronized with ledger.', 'info');
      this.cdr.detectChanges();
    }
  }

  approve(invoice: Invoice): void {
    if (confirm(`Authorize statement #${invoice.id} for final settlement with ₹${this.paidAmount} marked as paid?`)) {
      this.invoiceService.approve(invoice.id!, this.addOutstanding, this.paidAmount).subscribe({
        next: (updatedInvoice) => {
          this.toastService.success(`Invoice #${invoice.id} Authorized.`);

          if (this.selectedDriverUserId) {
            this.invoiceService.assignDriver(invoice.id!, this.selectedDriverUserId).subscribe({
              next: () => {
                this.toastService.success('Driver assigned successfully');
                this.fetchPendingInvoices();
                this.selectedInvoice = null;
                this.selectedDriverUserId = null;
              },
              error: () => this.toastService.error('Failed to assign driver')
            });
          } else {
            this.fetchPendingInvoices();
            this.selectedInvoice = null;
          }
        },
        error: () => this.toastService.error('Authorization failed')
      });
    }
  }

  settle(invoiceId: number): void {
    if (confirm('Verify delivery collection and perform final ledger settlement?')) {
      this.invoiceService.settle(invoiceId).subscribe({
        next: () => {
          this.toastService.success('Logistics settlement finalized. Customer balance updated.');
          this.fetchPendingInvoices();
          this.selectedInvoice = null;
        },
        error: () => this.toastService.error('Settlement protocol failure')
      });
    }
  }


  markPending(invoice: Invoice): void {
    if (confirm(`Set invoice #${invoice.id} status back to PENDING?`)) {
      this.invoiceService.markPending(invoice.id!).subscribe({
        next: () => {
          this.toastService.show(`Invoice #${invoice.id} is now PENDING.`, 'info');
          this.fetchPendingInvoices();
          this.selectedInvoice = null;
        },
        error: () => this.toastService.error('Failed to change status')
      });
    }
  }

  initiateReject(): void {
    this.isRejecting = true;
  }

  confirmReject(): void {
    if (!this.rejectionReason) {
      this.toastService.show('Please provide a reason for decommission.', 'warning');
      return;
    }
    this.invoiceService.reject(this.selectedInvoice!.id!, this.rejectionReason).subscribe({
      next: () => {
        this.toastService.show(`Invoice #${this.selectedInvoice!.id} Rejected. Reason: ${this.rejectionReason}`, 'info');
        this.fetchPendingInvoices();
        this.selectedInvoice = null;
        this.rejectionReason = '';
      },
      error: () => this.toastService.error('Rejection protocol failure')
    });
  }

  viewInModal(invoice: Invoice): void {
    this.selectedInvoiceForModal = invoice;
  }

  closeViewModal(): void {
    this.selectedInvoiceForModal = null;
  }

  printCurrentInvoice(): void {
    // Basic window print for now, leveraging @media print in CSS
    window.print();
  }
}
