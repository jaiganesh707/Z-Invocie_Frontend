import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodItemService } from '../../services/food-item.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { FoodItem } from '../../models/food-item.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {
  userId = signal<number>(0);
  isAdding = signal<boolean>(false);
  useExternalUrl = signal<boolean>(false);
  
  foodItems = signal<FoodItem[]>([]);
  newFoodItem: FoodItem = { name: '', price: 0, description: '', currency: 'INR', availableStocks: 0 };
  isEditing = false;
  editingId: number | null = null;
  selectedFile: File | null = null;

  private foodItemService = inject(FoodItemService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    const userObj = this.storageService.getUser();
    if (userObj && userObj.id) {
      // For workflow users, we always fetch the catalog of the parent (Prime User)
      const effectiveId = userObj.parentUserId || userObj.id;
      this.userId.set(effectiveId);
      this.fetchCatalog();
    }
  }

  fetchCatalog() {
    this.foodItemService.getAll(this.userId()).subscribe({
      next: (items) => this.foodItems.set(items),
      error: () => this.toastService.show('Failed to fetch user catalog', 'error')
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      this.newFoodItem.imageUrl = ''; 
    }
  }

  addFoodItem() {
    if (!this.newFoodItem.name || this.newFoodItem.price < 0) {
      this.toastService.show('Please provide valid name and valuation', 'warning');
      return;
    }

    this.newFoodItem.currency = this.newFoodItem.currency || 'INR';
    if (!this.newFoodItem.availableStocks) {
        this.newFoodItem.availableStocks = 0;
    }

    const skipUpload = this.useExternalUrl() || !this.selectedFile;
    const handleImageUpload = (id: number) => {
      if (!skipUpload) {
        this.foodItemService.uploadImage(id, this.selectedFile!, this.userId()).subscribe({
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
          this.toastService.show('Product updated successfully', 'success');
          handleImageUpload(this.editingId!);
        }
      });
    } else {
      this.foodItemService.create(this.newFoodItem, this.userId()).subscribe({
        next: (createdItem) => {
          this.toastService.show('New product added to catalog', 'success');
          if (createdItem.id) {
            handleImageUpload(createdItem.id);
          } else {
            this.resetForm();
            this.fetchCatalog();
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
    
    // Auto-detect if current asset is external
    const isExternal = item.imageUrl?.startsWith('http') || false;
    this.useExternalUrl.set(isExternal);
    
    this.isAdding.set(true);
  }

  deleteFoodItem(id: number) {
    if (confirm('Are you sure you want to remove this product?')) {
      this.foodItemService.delete(id, this.userId()).subscribe({
        next: () => {
          this.toastService.show('Product removed', 'success');
          this.fetchCatalog();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to remove product. It may be linked to an invoice.', 'error');
        }
      });
    }
  }

  resetForm() {
    this.newFoodItem = { name: '', price: 0, description: '', currency: 'INR', imageUrl: '', availableStocks: 0 };
    this.isEditing = false;
    this.isAdding.set(false);
    this.useExternalUrl.set(false);
    this.editingId = null;
    this.selectedFile = null;
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? `${environment.apiUrl}${url}` : `${environment.apiUrl}/${url}`;
  }
}
