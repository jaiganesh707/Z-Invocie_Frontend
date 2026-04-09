import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../services/toast.service';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.component.html',
  styleUrl: './customer-management.component.css'
})
export class CustomerManagementComponent implements OnInit {
  customers: Customer[] = [];
  isLoading = true;
  isFormVisible = false;
  isEditing = false;
  
  customerForm: Customer = this.resetForm();

  customerTypes = ['Individual', 'Corporate', 'Government', 'Wholesaler', 'Retailer'];

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.isLoading = true;
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // Force instant UI refresh
      },
      error: (err) => {
        this.toastService.error('Failed to load customers');
        this.isLoading = false;
        this.cdr.detectChanges(); // Force UI to stop spinning on error
      }
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) {
      this.isEditing = false;
      this.customerForm = this.resetForm();
    }
  }

  resetForm(): Customer {
    return {
      companyName: '',
      customerName: '',
      contactNumber: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      gstin: '',
      email: '',
      customerType: 'Individual'
    };
  }

  onEdit(customer: Customer): void {
    this.customerForm = { ...customer };
    this.isEditing = true;
    this.isFormVisible = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: number | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Customer deleted');
          this.fetchCustomers();
        },
        error: () => this.toastService.error('Failed to delete customer')
      });
    }
  }

  onSubmit(): void {
    if (this.isEditing && this.customerForm.id) {
      this.customerService.update(this.customerForm.id, this.customerForm).subscribe({
        next: () => {
          this.toastService.success('Customer updated successfully');
          this.toggleForm();
          this.fetchCustomers();
        },
        error: () => this.toastService.error('Failed to update customer')
      });
    } else {
      this.customerService.create(this.customerForm).subscribe({
        next: () => {
          this.toastService.success('Customer created successfully');
          this.toggleForm();
          this.fetchCustomers();
        },
        error: () => this.toastService.error('Failed to create customer')
      });
    }
  }
}
