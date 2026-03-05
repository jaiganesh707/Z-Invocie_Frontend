import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserAnalyticsComponent } from '../user-analytics/user-analytics';
import { FoodItemService } from '../../services/food-item.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { InvoiceService } from '../../services/invoice.service';
import { FoodItem } from '../../models/food-item.model';
import { Invoice } from '../../models/invoice.model';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    // ... (omitted selector and templates for brevity as they are unchanged)
    selector: 'app-stakeholder-hub',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, UserAnalyticsComponent],
    templateUrl: './stakeholder-hub.component.html',
    styles: [`
    .hub-container {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border-radius: 32px;
      border: 1px solid var(--glass-border);
      padding: 3rem;
      box-shadow: var(--glass-inner-glow), var(--shadow-premium);
    }
    .nav-pills .nav-link {
      color: var(--text-muted);
      border-radius: 16px;
      padding: 1rem 1.5rem;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .nav-pills .nav-link:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
    }
    .nav-pills .nav-link.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary-bright);
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    .catalog-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 24px;
      border: 1px solid var(--glass-border);
      padding: 1.75rem;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      box-shadow: var(--glass-inner-glow);
    }
    .catalog-card:hover {
      transform: translateY(-10px) scale(1.02);
      background: rgba(255, 255, 255, 0.07);
      border-color: var(--primary-bright);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1);
    }
    .catalog-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.5s;
    }
    .catalog-card:hover::before {
      opacity: 1;
    }
    .asset-id-badge {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.7rem;
      padding: 0.4rem 0.8rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 8px;
    }
    .value-footer {
      background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 1rem;
    }
    .asset-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      transition: all 0.3s;
    }
    .catalog-card:hover .asset-icon-box {
      background: var(--primary);
      color: white;
      transform: rotate(-5deg) scale(1.1);
    }
    .catalog-card:hover .asset-id-badge {
      background: rgba(16, 185, 129, 0.2);
    }
    .glass-reflection {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        to right,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transform: skewX(-25deg);
      transition: left 0.7s;
    }
    .glass.active {
      background: rgba(16, 185, 129, 0.2) !important;
      border-color: var(--primary-bright) !important;
      color: white !important;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }
    .upload-zone:hover {
      border-color: var(--primary-bright) !important;
      background: rgba(16, 185, 129, 0.05) !important;
    }
    .catalog-card:hover .glass-reflection {
      left: 150%;
    }
    .catalog-card img {
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .catalog-card:hover img {
      transform: scale(1.15);
    }
    .bg-glass {
      background: rgba(255, 255, 255, 0.03) !important;
      backdrop-filter: blur(10px);
    }
    .border-glass {
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    .shadow-inner {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .focus-none:focus {
      outline: none;
      box-shadow: none;
    }
    .bg-emerald-soft {
      background: rgba(16, 185, 129, 0.1);
    }
    .text-rose {
      color: #fb7185;
    }
    .ls-wide {
      letter-spacing: 0.1em;
    }
    .fw-600 {
      font-weight: 600;
    }
    .table-dark {
      --bs-table-bg: transparent;
      --bs-table-border-color: rgba(255, 255, 255, 0.05);
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1) brightness(0.5) sepia(1) saturate(5) hue-rotate(100deg);
      cursor: pointer;
    }
  `]
})
export class StakeholderHubComponent implements OnInit, OnDestroy {
    userId = signal<number>(0);
    user: any = null;
    activeTab = signal<string>('analytics');
    isAdding = signal<boolean>(false);

    // Billing Archive State
    startDate = signal<string>('');
    endDate = signal<string>('');
    invoices = signal<Invoice[]>([]);
    isLoadingInvoices = signal<boolean>(false);

    foodItems = signal<FoodItem[]>([]);
    private destroy$ = new Subject<void>();

    // Service Config Mock
    serviceConfig = {
        taxRate: 18,
        currency: 'INR',
        autoInvoicing: true
    };

    newFoodItem: FoodItem = { name: '', price: 0, description: '', currency: 'INR' };
    isEditing = false;
    editingId: number | null = null;
    selectedFile: File | null = null;

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0] as File;
        if (this.selectedFile) {
            this.newFoodItem.imageUrl = ''; // Clear URL mode when file is selected
        }
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private foodItemService: FoodItemService,
        private invoiceService: InvoiceService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const id = params['userId'];
            if (id) {
                this.userId.set(+id);
                this.fetchUser();
                this.fetchCatalog();
                this.fetchInvoices();
            }
        });

        // Polling every 30 seconds for catalog and activity
        interval(30000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.fetchCatalog();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fetchUser() {
        this.userService.users$.subscribe(users => {
            this.user = users.find(u => u.id === this.userId());
        });
    }

    fetchCatalog() {
        this.foodItemService.getAll(this.userId()).subscribe({
            next: (items) => this.foodItems.set(items),
            error: () => this.toastService.show('Failed to fetch user catalog', 'error')
        });
    }

    fetchInvoices() {
        this.isLoadingInvoices.set(true);
        let startIso = '';
        let endIso = '';

        if (this.startDate() && this.endDate()) {
            startIso = `${this.startDate()}T00:00:00`;
            endIso = `${this.endDate()}T23:59:59`;
        }

        this.invoiceService.getByUser(this.userId(), startIso, endIso).subscribe({
            next: (data) => {
                this.invoices.set(data);
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


    setTab(tab: string) {
        this.activeTab.set(tab);
        if (tab === 'billing') {
            this.fetchInvoices();
        }
    }

    updateConfig() {
        this.toastService.show('Billing configuration updated for user', 'success');
    }

    printInvoice(invoice: Invoice) {
        window.print();
    }

    addFoodItem() {
        if (!this.newFoodItem.name || this.newFoodItem.price < 0) {
            this.toastService.show('Please provide valid name and valuation', 'warning');
            return;
        }

        // Auto-assign currency if missing
        this.newFoodItem.currency = this.newFoodItem.currency || 'INR';

        const handleImageUpload = (id: number) => {
            if (this.selectedFile) {
                this.foodItemService.uploadImage(id, this.selectedFile, this.userId()).subscribe({
                    next: () => {
                        this.toastService.show('Image uploaded successfully', 'success');
                        this.resetForm();
                        this.fetchCatalog();
                    },
                    error: () => {
                        this.toastService.show('Image upload failed', 'error');
                        this.resetForm();
                        this.fetchCatalog();
                    }
                });
            } else {
                this.resetForm();
                this.fetchCatalog();
            }
        };

        if (this.isEditing && this.editingId) {
            this.foodItemService.update(this.editingId, this.newFoodItem, this.userId()).subscribe({
                next: () => {
                    this.toastService.show('Food item updated successfully', 'success');
                    handleImageUpload(this.editingId!);
                    this.isAdding.set(false);
                }
            });
        } else {
            this.foodItemService.create(this.newFoodItem, this.userId()).subscribe({
                next: (createdItem) => {
                    this.toastService.show('New food item added to user catalog', 'success');
                    if (createdItem.id) {
                        handleImageUpload(createdItem.id);
                        this.isAdding.set(false);
                    } else {
                        this.resetForm();
                        this.fetchCatalog();
                        this.isAdding.set(false);
                    }
                }
            });
        }
    }

    editItem(item: FoodItem) {
        this.newFoodItem = { ...item };
        this.isEditing = true;
        this.editingId = item.id!;
        this.selectedFile = null;
        this.isAdding.set(true);
    }

    deleteFoodItem(id: number) {
        if (confirm('Are you sure you want to remove this food item?')) {
            this.foodItemService.delete(id, this.userId()).subscribe({
                next: () => {
                    this.toastService.show('Food item removed', 'success');
                    this.fetchCatalog();
                },
                error: (err) => {
                    this.toastService.show(err.error?.message || 'Failed to remove food item. It may be linked to an invoice.', 'error');
                }
            });
        }
    }

    resetForm() {
        this.newFoodItem = { name: '', price: 0, description: '', currency: 'INR', imageUrl: '' };
        this.isEditing = false;
        this.isAdding.set(false);
        this.editingId = null;
        this.selectedFile = null;
    }

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://localhost:8084${url}`;
    }
}
