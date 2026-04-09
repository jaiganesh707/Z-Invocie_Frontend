import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { FoodItemService } from '../../services/food-item.service';
import { TaxService, CustomTax } from '../../services/tax.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { DriverService } from '../../services/driver.service';
import { CreateInvoiceDto, Invoice } from '../../models/invoice.model';
import { Customer } from '../../models/customer.model';
import { FoodItem } from '../../models/food-item.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.css'
})
export class InvoiceFormComponent implements OnInit {
  userId = signal<number>(0);
  loggedInUser = signal<any>(null);
  primeUser = signal<any>(null);
  currentDate = signal<string>(new Date().toLocaleString());

  customers = signal<Customer[]>([]);
  products = signal<FoodItem[]>([]);
  activeTaxes = signal<CustomTax[]>([]);

  searchQuery = signal<string>('');
  showGallery = signal<boolean>(false);

  selectedCustomerId = signal<number | undefined>(undefined);
  selectedItems = signal<{ product: FoodItem, quantity: number }[]>([]);

  isLoading = signal<boolean>(false);
  step = signal<number>(1); // 1: Customer & Header, 2: Items, 3: Review

  outstandingAmount = signal<number>(0);
  deliveryRequired = signal<boolean>(false);
  preferredDriverId = signal<number | undefined>(undefined);
  availableDrivers = signal<any[]>([]);
  customerAddress = signal<string>('');
  customerGstin = signal<string>('');

  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private foodItemService = inject(FoodItemService);
  private taxService = inject(TaxService);
  private userService = inject(UserService);
  private driverService = inject(DriverService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Computed properties
  subtotal = computed(() => {
    return this.selectedItems().reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  });

  totalTax = computed(() => {
    const totalTaxPerc = this.activeTaxes().reduce((sum, tax) => sum + Number(tax.percentage), 0);
    return (this.subtotal() * totalTaxPerc) / 100;
  });

  grandTotal = computed(() => this.subtotal() + this.totalTax());
  
  totalPayable = computed(() => this.grandTotal());


  selectedCustomer = computed(() => {
    const id = this.selectedCustomerId();
    return this.customers().find(c => c.id === id);
  });

  onCustomerSelect(id: any): void {
      const customerId = Number(id);
      this.selectedCustomerId.set(customerId);
      const customer = this.customers().find(c => c.id === customerId);
      if (customer) {
          // Comprehensive Address and Meta Sync
          const fullAddress = [
              customer.address,
              customer.city,
              customer.pinCode ? `PIN: ${customer.pinCode}` : ''
          ].filter(Boolean).join(', ');

          
          this.customerAddress.set(fullAddress);
          this.customerGstin.set(customer.gstin || '');
          
          // RECENT ADJUSTMENT: Legacy debt is no longer auto-pulled during creation 
          // to keep the initial bill focused only on current assets and GST.
          this.outstandingAmount.set(0);
      }
  }




  ngOnInit(): void {
    const user = this.storageService.getUser();
    if (user && user.id) {
      this.loggedInUser.set(user);

      // Determine the Prime User context
      const effectivePrimeId = user.parentUserId || user.id;
      this.userId.set(effectivePrimeId);

      if (user.parentUserId) {
        this.userService.getUserById(user.parentUserId).subscribe(pu => this.primeUser.set(pu));
      } else {
        this.primeUser.set(user);
      }

      this.fetchInitialData();

      // Update time every minute
      setInterval(() => this.currentDate.set(new Date().toLocaleString()), 60000);
    } else {
      this.router.navigate(['/login']);
    }
  }

  fetchInitialData(): void {
    this.isLoading.set(true);
    const primeId = this.userId(); // Always the Prime User's ID

    // Load Prime User's customers (employees support Prime User's work)
    this.customerService.getByUser(primeId).subscribe({
      next: data => this.customers.set(data),
      error: () => this.customerService.getAll().subscribe(data => this.customers.set(data))
    });

    // Load Prime User's products
    this.foodItemService.getAll(primeId).subscribe(data => this.products.set(data));

    // Load Prime User's active taxes
    this.taxService.getActiveTaxes(primeId).subscribe({
      next: data => this.activeTaxes.set(data),
      error: () => this.activeTaxes.set([])
    });

    this.driverService.getByParent().subscribe({
      next: data => { this.availableDrivers.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.products().filter(p => p.name.toLowerCase().includes(query));
  });

  addFromGallery(product: FoodItem): void {
    const existing = this.selectedItems().find(item => item.product.id === product.id);
    if (existing) {
      this.onQuantityAdd(product.id!, 1);
    } else {
      this.selectedItems.update(items => [...items, { product, quantity: 1 }]);
    }
    this.toastService.success(`Node Added: ${product.name} synchronized to statement.`);
  }

  onQuantityAdd(productId: number, delta: number): void {
    this.selectedItems.update(items => {
      return items.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  }

  addItem(): void {
    const defaultProduct = this.products()[0];
    if (defaultProduct) {
      this.selectedItems.update(items => [...items, { product: defaultProduct, quantity: 1 }]);
    }
  }

  removeItem(index: number): void {
    this.selectedItems.update(items => items.filter((_, i) => i !== index));
  }

  onProductChange(index: number, productId: any): void {
    const product = this.products().find(p => p.id === Number(productId));
    if (product) {
      this.selectedItems.update(items => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], product: product };
        return newItems;
      });
    }
  }

  onQuantityChange(index: number, quantity: any): void {
    const qty = Number(quantity);
    if (qty > 0) {
      this.selectedItems.update(items => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], quantity: qty };
        return newItems;
      });
    }
  }

  nextStep(): void {
    if (this.step() === 1 && !this.selectedCustomerId()) {
      this.toastService.error('Please identify the recipient first.');
      return;
    }
    if (this.step() === 2 && this.selectedItems().length === 0) {
      this.toastService.error('Invoice must contain at least one terminal asset.');
      return;
    }
    this.step.update(s => s + 1);
  }

  importOutstanding(): void {
    const balance = this.selectedCustomer()?.outstandingBalance;
    if (balance && balance > 0) {
      this.outstandingAmount.set(balance);
      this.toastService.success(`Imported legacy balance: ₹${balance}. Synchronized for verification.`);
    } else {
      this.toastService.show('No existing outstanding balance detected for this node.', 'info');
    }
  }

  prevStep(): void {
    this.step.update(s => s - 1);
  }

  saveInvoice(status: string = 'CREATED'): void {
    this.isLoading.set(true);
    const user = this.loggedInUser();
    const dto: CreateInvoiceDto = {
      userId: this.userId(), // Prime User ID
      creatorId: user?.id,   // Current logged-in user
      customerId: this.selectedCustomerId(),
      status: status,
      outstandingAmount: this.outstandingAmount(),
      deliveryRequired: this.deliveryRequired(),
      preferredDriverId: this.preferredDriverId(),
      billingAddress: this.customerAddress(),
      customerGstin: this.customerGstin(),
      items: this.selectedItems().map(si => ({
        foodItemId: si.product.id!,
        quantity: si.quantity
      }))
    };

    this.invoiceService.create(dto).subscribe({
      next: () => {
        let msg = 'Financial statement finalized and verified.';
        if (status === 'DRAFT') msg = 'Draft record archived.';
        if (status === 'CREATED') msg = 'Invoice record created for verification.';
        this.toastService.success(msg);
        const user = this.loggedInUser();
        // Redirect: Workflow users go to their dashboard, Prime Users go to invoice list
        if (user?.role === 'ROLE_WORKFLOW_USER') {
          this.router.navigate(['/workflow-dashboard']);
        } else {
          this.router.navigate(['/invoices']);
        }
      },
      error: (err) => {
        this.toastService.error('Fatal synchronization error. Ledger rejected the record.');
        console.error('Invoice save error:', err);
        this.isLoading.set(false);
      }
    });
  }
}
