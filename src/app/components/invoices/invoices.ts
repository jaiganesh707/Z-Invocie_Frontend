import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css']
})
export class Invoices implements OnInit {
  userId = signal<number>(0);
  user: any = null;

  invoices = signal<Invoice[]>([]);
  primeInvoices = signal<Invoice[]>([]);
  isLoadingInvoices = signal<boolean>(false); 
  selectedInvoice = signal<Invoice | null>(null);
  
  pendingInvoicesQueue = computed(() => {
    return this.primeInvoices().filter((inv: Invoice) => {
      const isPending = inv.status === 'CREATED' || inv.status === 'PENDING';
      // Only show invoices created by employees/workflow users in the approval queue
      // Invoices created directly by Prime Users are considered self-authorized
      const isFromEmployee = inv.createdBy && (inv.createdBy.role === 'ROLE_PRIME_USER' || inv.createdBy.role === 'ROLE_USER');
      return isPending && isFromEmployee;
    });
  });

  completedInvoicesArchive = computed(() => {
    return this.primeInvoices().filter((inv: Invoice) => {
      if (inv.status === 'APPROVED') return true;
      // Also include invoices created by Prime Users that are in CREATED status
      const isPrimeCreation = inv.createdBy && inv.createdBy.role === 'ROLE_PRIME_USER';
      return isPrimeCreation && (inv.status === 'CREATED' || inv.status === 'PENDING_APPROVAL');
    });
  });

  draftInvoices = computed(() => {
    return this.primeInvoices().filter((inv: Invoice) => inv.status === 'DRAFT');
  });

  totalNetVolume = computed(() => {
    return this.completedInvoicesArchive().reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  });

  startDate = signal<string>('');
  endDate = signal<string>('');
  manualPaidAmount = 0;

  private invoiceService = inject(InvoiceService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    const userObj = this.storageService.getUser();
    if (userObj && userObj.id) {
      this.userId.set(userObj.id);
      this.user = userObj;
      this.fetchInvoices();
    } else {
      this.router.navigate(['/login']);
    }
  }

  fetchInvoices() {
    this.isLoadingInvoices.set(true);
    let startIso = '';
    let endIso = '';

    if (this.startDate() && this.endDate()) {
      startIso = `${this.startDate()}T00:00:00`;
      endIso = `${this.endDate()}T23:59:59`;
    }

    // Determine the root business group owner (the Prime User)
    const rootPrimeId = this.user.role === 'ROLE_PRIME_USER' ? this.user.id : (this.user.user ? this.user.user.id : this.user.id);

    // IMPORTANT: Make the API call using the business owner's ID (rootPrimeId), 
    // because employees are stored in a different database table and querying by 
    // their ID directly on the invoice endpoint will return empty.
    this.invoiceService.getByUser(rootPrimeId, startIso, endIso).subscribe({
      next: (data) => {
        this.invoices.set(data);

        const isEmployee = !!this.user.parentUserId;
        

        const groupInvoices = data.filter(inv => {
          if (isEmployee) {
            // Requirement updated: Employees should ONLY see the invoices they personally created
            return (inv.createdBy && inv.createdBy.id === this.userId()) ||
              (inv.creatorEmployeeId === this.userId());
          }
           else {
            // Prime User / Boss sees the entire organizational archive
            return true;
          }

        }); 

        this.primeInvoices.set(groupInvoices);
        this.isLoadingInvoices.set(false);
      },
      error: () => {
        this.toastService.show('Failed to fetch billing archive', 'error');
        this.isLoadingInvoices.set(false);
      }
    });
  }

  applyFilters() {
    if (this.startDate() && !this.endDate()) return;
    if (!this.startDate() && this.endDate()) return;
    this.fetchInvoices();
  }

  clearFilters() {
    this.startDate.set('');
    this.endDate.set('');
    this.fetchInvoices();
  }

  printInvoice(invoice: Invoice) {
    window.print();
  }

  deleteInvoice(id: number, status:string) {
    if (!id) {
    this.toastService.show('Invalid invoice ID', 'error');
    return;
  }
    if (status === 'APPROVED') {
    this.toastService.show('Approved invoices cannot be deleted', 'warning');
    return;
    }
    if (confirm('Permanently terminate this invoice node from the ledger? This action cannot be reversed.')) {
      this.invoiceService.delete(id).subscribe({
        next: () => {
          this.toastService.show('Ledger entry terminated successfully', 'success');
          this.primeInvoices.set(
          this.primeInvoices().filter(inv => inv.id !== id)
        );

          this.fetchInvoices();
        },
        error: (err) =>{
          console.error(err);
          this.toastService.show('Failed to terminate ledger entry', 'error')
        } 
      });
    }
  }
  

  viewInvoice(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.manualPaidAmount = 0;
  }

  closeView() {
    this.selectedInvoice.set(null);
  }

  // ─── Submit for Approval Modal ────────────────────────────────────────────
  submitModalInvoice = signal<Invoice | null>(null);
  submissionNote = '';
  isSubmitting = signal<boolean>(false);

  openSubmitModal(invoice: Invoice) {
    this.submissionNote = '';
    this.submitModalInvoice.set(invoice);
  }

  closeSubmitModal() {
    this.submitModalInvoice.set(null);
    this.isSubmitting.set(false);
  }

  submitForApproval() {
    const inv = this.submitModalInvoice();
    if (!inv || !inv.id) return;
    if (!this.submissionNote.trim()) {
      this.toastService.show('Please enter a submission reason before sending', 'warning');
      return;
    }
    this.isSubmitting.set(true);
    this.invoiceService.submitForApproval(inv.id, this.submissionNote.trim()).subscribe({
      next: () => {
        this.toastService.show('Invoice submitted for approval successfully', 'success');
        this.closeSubmitModal();
        this.fetchInvoices();
      },
      error: (err) => {
        console.error(err);
        this.toastService.show('Failed to submit invoice for approval', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  settleInvoicePayment(invoiceId: number) {
    if (this.manualPaidAmount <= 0) return;
    this.invoiceService.updatePayment(invoiceId, this.manualPaidAmount).subscribe({
      next: (updated) => {
        this.toastService.show('Payment recorded in ledger', 'success');
        this.selectedInvoice.set(updated);
        // Refresh the list to reflect updated balances/status
        this.fetchInvoices();
        this.manualPaidAmount = 0;
      },
      error: () => this.toastService.show('Ledger synchronization failed', 'error')
    });
  }

  quickSettle(invoiceId: number, remaining: number) {
    if (remaining <= 0) return;
    if (confirm(`Authorize full settlement of ₹${remaining} for this archive record?`)) {
      this.invoiceService.updatePayment(invoiceId, remaining).subscribe({
        next: (updated) => {
          this.toastService.show('Full settlement finalized', 'success');
          this.selectedInvoice.set(updated);
          this.fetchInvoices();
        },
        error: () => this.toastService.show('Settlement failed', 'error')
      });
    }
  }
}
