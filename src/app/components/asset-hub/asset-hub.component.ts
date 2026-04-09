import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { BusinessAsset } from '../../models/business-asset.model';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-asset-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-hub.component.html',
  styleUrls: ['./asset-hub.component.css']
})
export class AssetHubComponent implements OnInit {
  assets = signal<BusinessAsset[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingAsset = signal<BusinessAsset | null>(null);

  // Form Fields
  assetName = '';
  description = '';
  assetImageUrl = '';
  targetUrl = '';

  constructor(
    private assetService: AssetService,
    private storageService: StorageService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchAssets();
  }

  fetchAssets(): void {
    this.isLoading.set(true);
    this.assetService.getAll().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Archive Synch Error: Failed to retrieve business assets.');
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(asset: BusinessAsset | null = null): void {
    if (asset) {
      this.editingAsset.set(asset);
      this.assetName = asset.assetName;
      this.description = asset.description;
      this.assetImageUrl = asset.assetImageUrl;
      this.targetUrl = asset.targetUrl;
      this.showForm.set(true);
    } else {
      this.resetForm();
      this.showForm.set(!this.showForm());
    }
  }

  resetForm(): void {
    this.editingAsset.set(null);
    this.assetName = '';
    this.description = '';
    this.assetImageUrl = '';
    this.targetUrl = '';
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.assetImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveAsset(): void {
    if (!this.assetName || !this.assetImageUrl) {
      this.toastService.warning('Provisioning Halt: Asset Name and Global Image are required.');
      return;
    }

    this.isSaving.set(true);
    const assetData: BusinessAsset = {
      assetName: this.assetName,
      description: this.description,
      assetImageUrl: this.assetImageUrl,
      targetUrl: this.targetUrl
    };

    const request = this.editingAsset() 
      ? this.assetService.update(this.editingAsset()!.id!, assetData)
      : this.assetService.create(assetData);

    request.subscribe({
      next: () => {
        this.toastService.success(`Asset Transaction Realized: ${this.assetName} successfully saved.`);
        this.fetchAssets();
        this.showForm.set(false);
        this.resetForm();
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Asset Transaction Failed: Secure write protocol interrupted.');
        this.isSaving.set(false);
      }
    });
  }

  deleteAsset(id: number): void {
    if (confirm('Verify Destructive Protocol: Permanent archival of this business asset?')) {
      this.assetService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Asset Purge Complete: Node permanently decoupled from ledger.');
          this.fetchAssets();
        },
        error: () => this.toastService.error('De-provisioning Error: Failed to purge record.')
      });
    }
  }

  navigateTo(url: string): void {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  }
}
