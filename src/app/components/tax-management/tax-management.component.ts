import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxService, CustomTax } from '../../services/tax.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tax-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tax-management.component.html',
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    .tax-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tax-item:hover {
      background: rgba(255, 255, 255, 0.04);
      transform: translateY(-2px);
      border-color: rgba(16, 185, 129, 0.3);
    }
    .badge-active {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-inactive {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .input-field {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 12px;
      padding: 0.75rem 1rem;
    }
    .input-field:focus {
      background: rgba(255, 255, 255, 0.05);
      border-color: #10b981;
      outline: none;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    }
  `]
})
export class TaxManagementComponent implements OnInit {
  userId = signal<number>(0);
  taxes = signal<CustomTax[]>([]);
  isLoading = signal<boolean>(false);
  isFormVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  taxForm: CustomTax = this.resetForm();

  private taxService = inject(TaxService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    const user = this.storageService.getUser();
    if (user && user.id) {
      this.userId.set(user.id);
      this.fetchTaxes();
    }
  }

  fetchTaxes(): void {
    this.isLoading.set(true);
    this.taxService.getAllForUser(this.userId()).subscribe({
      next: (data) => {
        this.taxes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to synchronize tax protocols');
        this.isLoading.set(false);
      }
    });
  }

  resetForm(): CustomTax {
    return {
      userId: this.userId(),
      name: '',
      percentage: 0,
      description: '',
      isActive: true
    };
  }

  toggleForm(): void {
    this.isFormVisible.set(!this.isFormVisible());
    if (!this.isFormVisible()) {
      this.isEditing.set(false);
      this.taxForm = this.resetForm();
    }
  }

  editTax(tax: CustomTax): void {
    this.taxForm = { ...tax };
    this.isEditing.set(true);
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (this.isEditing() && this.taxForm.id) {
      this.taxService.update(this.taxForm.id, this.userId(), this.taxForm).subscribe({
        next: () => {
          this.toastService.success('Tax protocol recalibrated successfully.');
          this.toggleForm();
          this.fetchTaxes();
        },
        error: () => this.toastService.error('Failed to update tax protocol.')
      });
    } else {
      this.taxService.create(this.userId(), this.taxForm).subscribe({
        next: () => {
          this.toastService.success('New tax protocol initialized.');
          this.toggleForm();
          this.fetchTaxes();
        },
        error: () => this.toastService.error('Failed to initialize tax protocol.')
      });
    }
  }

  deleteTax(id: number | undefined): void {
    if (!id) return;
    if (confirm('Permanently decommission this tax protocol from the financial engine?')) {
      this.taxService.delete(id, this.userId()).subscribe({
        next: () => {
          this.toastService.success('Tax protocol decommissioned.');
          this.fetchTaxes();
        },
        error: () => this.toastService.error('Decommissioning failed.')
      });
    }
  }
}
