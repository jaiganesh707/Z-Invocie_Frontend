import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FoodItemService } from '../../services/food-item.service';
import { InvoiceService } from '../../services/invoice.service';
import { UserService } from '../../services/user.service';
import { FoodItem } from '../../models/food-item.model';
import { CreateInvoiceDto } from '../../models/invoice.model';

import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-user-billing',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './user-billing.component.html',
    styleUrls: ['./user-billing.component.css']
})
export class UserBillingComponent implements OnInit {
    userId!: number;
    foodItems: FoodItem[] = [];
    selectedItems: { foodItem: FoodItem, quantity: number }[] = [];
    totalAmount = 0;
    isGenerated = false;
    generatedInvoice: any = null;
    user: any = null;
    isLoading = false;
    searchQuery: string = '';

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
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('userId');
            this.userId = Number(idParam);

            if (idParam && !isNaN(this.userId)) {
                this.reset(); // Reset state for the new user
                this.fetchFoodItems();
                this.fetchUserData();
            } else {
                this.toastService.error('Invalid Session: Stakeholder ID not identified. Redirecting...');
                this.router.navigate(['/super-admin']);
            }
        });
    }

    fetchFoodItems(): void {
        this.isLoading = true;
        this.foodItemService.getAll(this.userId).subscribe({
            next: data => {
                this.foodItems = data || [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
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
                console.error('Failed to fetch stakeholder profile', err);
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

    generateBill(): void {
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
            }
        });
    }

    printBill(): void {
        window.print();
    }

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://localhost:8084${url}`;
    }

    reset(): void {
        this.selectedItems = [];
        this.totalAmount = 0;
        this.isGenerated = false;
        this.generatedInvoice = null;
    }
}
