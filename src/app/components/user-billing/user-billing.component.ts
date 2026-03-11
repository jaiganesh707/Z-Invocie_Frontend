import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FoodItemService } from '../../services/food-item.service';
import { InvoiceService } from '../../services/invoice.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { FoodItem } from '../../models/food-item.model';
import { CreateInvoiceDto } from '../../models/invoice.model';

import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-user-billing',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './user-billing.component.html',
    styleUrls: ['./user-billing.component.css']
})
export class UserBillingComponent implements OnInit, OnDestroy {
    userId!: number;
    foodItems: FoodItem[] = [];
    selectedItems: { foodItem: FoodItem, quantity: number }[] = [];
    totalAmount = 0;
    isGenerated = false;
    generatedInvoice: any = null;
    paymentMode: 'cash' | 'upi' = 'cash';
    upiQrUrl: string = '';
    user: any = null;
    isLoading = false;
    upiPaid = false;
    searchQuery: string = '';
    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private foodItemService: FoodItemService,
        private invoiceService: InvoiceService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const idParam = params.get('userId');
            this.userId = Number(idParam);

            if (idParam && !isNaN(this.userId)) {
                this.reset();
                this.fetchFoodItems();
                this.fetchUserData();
            } else {
                this.toastService.error('Invalid Session: Stakeholder ID not identified. Redirecting...');
                this.router.navigate(['/super-admin']);
            }
        });

        // Polling every 30 seconds for catalog updates
        interval(30000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (!this.isGenerated) {
                    this.fetchFoodItems(false);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fetchFoodItems(showLoading = true): void {
        if (showLoading) this.isLoading = true;
        this.foodItemService.getAll(this.userId).subscribe({
            next: data => {
                this.foodItems = data || [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: err => {
                this.toastService.error('Failed to synchronize asset catalog.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    fetchUserData(): void {
        this.userService.getUserById(this.userId).subscribe({
            next: (data: any) => {
                this.user = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.toastService.error('Critical: Failed to resolve stakeholder identity.');
            }
        });
    }

    get filteredFoodItems(): FoodItem[] {
        if (!this.searchQuery) return this.foodItems;
        const q = this.searchQuery.toLowerCase();
        return this.foodItems.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
    }

    addToBill(item: FoodItem, quantity: number = 1): void {
        const existing = this.selectedItems.find(si => si.foodItem.id === item.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.selectedItems.push({ foodItem: item, quantity: quantity });
        }
        this.calculateTotal();
    }

    removeFromBill(index: number): void {
        this.selectedItems.splice(index, 1);
        this.calculateTotal();
    }

    updateQuantity(index: number, quantity: number): void {
        if (quantity <= 0) {
            this.removeFromBill(index);
        } else {
            this.selectedItems[index].quantity = quantity;
        }
        this.calculateTotal();
    }

    calculateTotal(): void {
        this.totalAmount = this.selectedItems.reduce((acc, curr) => acc + (curr.foodItem.price * curr.quantity), 0);
    }

    generateBill(mode: 'cash' | 'upi' = 'cash'): void {
        this.paymentMode = mode;
        // Double-check userId from route if it's somehow missing from memory
        if (!this.userId || isNaN(this.userId)) {
            this.userId = Number(this.route.snapshot.paramMap.get('userId'));
        }

        if (!this.userId || isNaN(this.userId)) {
            this.toastService.error('Fatal: Client identity lost. Please reload the billing terminal.');
            return;
        }

        if (this.selectedItems.length === 0) {
            this.toastService.show('Please select at least one asset to include in the statement.', 'warning');
            return;
        }

        const dto: CreateInvoiceDto = {
            userId: this.userId,
            items: this.selectedItems.map(si => ({
                foodItemId: si.foodItem.id!,
                quantity: si.quantity
            }))
        };

        this.invoiceService.create(dto).subscribe({
            next: data => {
                this.toastService.success('Bill generated and verified successfully.');
                this.isGenerated = true;
                this.generatedInvoice = data;
                this.upiPaid = false; // Reset for new UPI transaction

                if (this.paymentMode === 'upi' && this.user && this.user.upiId) {
                    const invoiceId = this.generatedInvoice.id;
                    const upiString = `upi://pay?pa=${this.user.upiId}&pn=${encodeURIComponent(this.user.payeeName || this.user.username)}&am=${this.totalAmount}&cu=${this.user.currency || 'INR'}&tn=Invoice_${invoiceId}`;
                    this.upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
                } else if (this.paymentMode === 'upi') {
                    this.toastService.show('Node has no UPI configuration! Falling back to standard invoice.', 'warning');
                }
            },
            error: err => {
                this.toastService.error('Verification Failed: External settlement node rejected the request.');
            }
        });
    }

    printBill(): void {
        window.print();
    }

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${environment.apiUrl}${url}`;
    }

    verifyUpiPayment(): void {
        this.isLoading = true;
        this.toastService.show('Synchronizing with bank terminal...', 'info');

        setTimeout(() => {
            this.upiPaid = true;
            this.isLoading = false;
            this.toastService.show('Transaction Authenticated. Generating Statement.', 'success');
            this.cdr.detectChanges();
        }, 2000);
    }

    reset(): void {
        this.selectedItems = [];
        this.totalAmount = 0;
        this.isGenerated = false;
        this.generatedInvoice = null;
        this.upiQrUrl = '';
        this.upiPaid = false;
    }
}
