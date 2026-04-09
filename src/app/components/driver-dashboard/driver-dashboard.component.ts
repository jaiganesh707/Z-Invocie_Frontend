import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryOrderService, DeliveryOrder, DeliveryStatus } from '../../services/delivery-order.service';
import { DriverService, DriverDetails } from '../../services/driver.service';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">


      <div class="header-section mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 class="display-5 fw-bold">Driver Command</h1>
          <p class="text-muted">Unit Identity: {{ driverDetails.userId }}</p>
        </div>
        <div class="tabs-group glass p-1 rounded-pill d-flex">
          <button class="btn rounded-pill px-4" [class.btn-primary]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">Dashboard</button>
          <button class="btn rounded-pill px-4" [class.btn-primary]="activeTab === 'orders'" (click)="activeTab = 'orders'">Orders</button>
          <button class="btn rounded-pill px-4" [class.btn-primary]="activeTab === 'settings'" (click)="activeTab = 'settings'">Settings</button>
        </div>
      </div>

      <!-- Dashboard Tab -->
      <div *ngIf="activeTab === 'dashboard'" class="animate-fade">
        <div class="row g-4 mb-5">
          <div class="col-md-4">
            <div class="stat-card">
              <span class="label">Total Assignements</span>
              <span class="value">{{ activeOrders.length }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card bg-blue">
              <span class="label">Status</span>
              <span class="value text-white">Active</span>
            </div>
          </div>
        </div>
        
        <div class="glass-section p-5 text-center">
           <i class="bi bi-speedometer2 display-1 text-emerald mb-3"></i>
           <h3>System Performance: Operational</h3>
           <p class="text-muted">You are currently visible to nearby shippers.</p>
        </div>
      </div>

      <!-- Orders Tab -->
      <div *ngIf="activeTab === 'orders'" class="animate-fade">
        <div class="glass-section mb-5">
          <h2 class="mb-4">Active Deployments (Orders)</h2>
          <div class="table-responsive" *ngIf="activeOrders.length > 0; else noOrders">
            <!-- ... existing table remains ... -->
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of activeOrders">
                  <td>#{{ order.id }}</td>
                  <td>{{ order.shopName }}</td>
                  <td><span class="badge" [ngClass]="getStatusBadge(order.status)">{{ order.status }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-link" (click)="updateStatus(order.id, 'PICKED_UP')">Pick</button>
                    <button class="btn btn-sm btn-link" (click)="updateStatus(order.id, 'DELIVERED')">Done</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="mt-5 mb-4">Direct Shipments (Invoices)</h2>
          <div class="table-responsive" *ngIf="assignedInvoices.length > 0; else noInvoices">
            <table class="table table-hover table-dark border-glass">
              <thead>
                <tr>
                  <th>Invoice#</th>
                  <th>Client</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of assignedInvoices">
                  <td>#{{ inv.invoiceNumber }}</td>
                  <td>
                    <div class="fw-bold text-white">{{ inv.customer?.companyName || 'N/A' }}</div>
                    <div class="x-small text-muted">{{ inv.customer?.customerName }}</div>
                  </td>
                  <td>
                     <div class="small text-white"><i class="bi bi-geo-alt me-1 text-emerald"></i> {{ inv.customer?.address }}, {{ inv.customer?.city }}</div>
                     <div class="small text-muted"><i class="bi bi-telephone me-1 text-emerald"></i> {{ inv.customer?.contactNumber }}</div>
                  </td>
                  <td>{{ inv.totalAmount | currency:'INR' }}</td>
                  <td>
                    <span class="badge" [class.bg-info]="inv.deliveryStatus === 'ASSIGNED'" 
                          [class.bg-warning]="inv.deliveryStatus === 'IN_TRANSIT'"
                          [class.bg-success]="inv.deliveryStatus === 'DELIVERED'">
                      {{ inv.deliveryStatus || 'PENDING' }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm btn-outline-info" (click)="updateInvoiceStatus(inv.id!, 'IN_TRANSIT')">
                        <i class="bi bi-truck me-1"></i> Start
                      </button>
                      <button class="btn btn-sm btn-outline-success" (click)="updateInvoiceStatus(inv.id!, 'DELIVERED')">
                        <i class="bi bi-check-circle me-1"></i> Receive & Done
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noInvoices>
            <div class="p-4 text-center text-muted border border-dashed rounded-4">No direct invoices assigned.</div>
          </ng-template>

          <ng-template #noOrders>
            <div class="p-5 text-center text-muted border border-dashed rounded-4">No active orders assigned to your unit.</div>
          </ng-template>
        </div>
      </div>

      <!-- Settings Tab -->
      <div *ngIf="activeTab === 'settings'" class="animate-fade">
        <div class="glass-section">
          <h2 class="mb-4">Node Configuration</h2>
          <div class="row g-4">
            <div class="col-md-4">
               <div class="profile-photo-container text-center mb-3">
                  <div class="avatar-hub mx-auto mb-3 shadow-lg" style="width: 180px; height: 180px;">
                    <img [src]="driverDetails.driverPhoto || 'assets/default-driver.png'" class="w-100 h-100 object-fit-cover rounded-circle border border-5 border-glass">
                  </div>
                  <h5 class="fw-bold">{{ driverDetails.name }}</h5>
                  <p class="text-muted small">Registered Fleet Member</p>
               </div>
            </div>
            <div class="col-md-8">
              <form (ngSubmit)="saveProfile()">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Bike Number</label>
                    <input type="text" class="form-control glass" [(ngModel)]="driverDetails.bikeNo" name="bikeNo">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">License Number</label>
                    <input type="text" class="form-control glass" [(ngModel)]="driverDetails.licenseNumber" name="licenseNo">
                  </div>
                  <div class="col-md-12">
                    <label class="form-label">Address</label>
                    <textarea class="form-control glass" rows="3" [(ngModel)]="driverDetails.address" name="address"></textarea>
                  </div>
                  <div class="col-12 mt-4 text-end">
                    <button type="submit" class="btn btn-primary px-5 rounded-pill shadow">UPDATE RECO</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2rem;
    }
    .stat-card {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      padding: 1.5rem;
      border-radius: 20px;
      color: white;
    }
    .stat-card .label { font-size: 0.9rem; opacity: 0.8; display: block; }
    .stat-card .value { font-size: 2rem; font-weight: bold; }
    .badge-pending { background: #f59e0b; }
    .badge-assigned { background: #3b82f6; }
    .badge-picked_up { background: #10b981; }
    .badge-delivered { background: #10b981; }
    .badge-cancelled { background: #ef4444; }
  `]

})
export class DriverDashboardComponent implements OnInit {
  activeTab: 'dashboard' | 'orders' | 'settings' = 'dashboard';
  activeOrders: DeliveryOrder[] = [];
  assignedInvoices: Invoice[] = [];
  driverDetails: DriverDetails = {};

  constructor(
    private deliveryService: DeliveryOrderService,
    private driverService: DriverService,
    private invoiceService: InvoiceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadDriverDetails();
  }

  loadOrders() {
    this.deliveryService.getDriverOrders().subscribe(orders => {
      this.activeOrders = orders;
    });

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    if (userObj.id) {
       this.invoiceService.getByUser(userObj.id).subscribe(invoices => {
         this.assignedInvoices = invoices;
       });
    }
  }

  loadDriverDetails() {
    this.driverService.getMyDetails().subscribe(details => {
      this.driverDetails = details;
    }, err => {
        // If not found, init with empty
        this.driverDetails = { bikeNo: '', licenseNumber: '', address: '' };
    });
  }

  saveProfile() {
    this.driverService.updateDetails(this.driverDetails).subscribe(() => {
      this.toastService.show('Profile updated successfully!', 'success');
    });
  }

  updateStatus(id: any, status: any) {
    this.deliveryService.updateStatus(id, status as DeliveryStatus).subscribe(() => {
      this.toastService.show(`Order updated to ${status}`, 'success');
      this.loadOrders();
    });
  }

  updateInvoiceStatus(id: number, status: string) {
    let amountCollected: number | undefined = undefined;
    
    if (status === 'DELIVERED') {
      const input = window.prompt('Enter total amount collected from recipient (Financial Surrender):');
      if (input === null) return; // Cancelled
      amountCollected = parseFloat(input);
      if (isNaN(amountCollected)) {
        this.toastService.error('Invalid amount entry. Surrender protocol aborted.');
        return;
      }
    }

    this.invoiceService.updateDeliveryStatus(id, status, amountCollected).subscribe({
      next: () => {
        this.toastService.success(`Invoice shipment updated to ${status}. Data synchronized.`);
        this.loadOrders();
      },
      error: () => this.toastService.error('Synchronization failure with main ledger')
    });
  }

  getStatusBadge(status: any) {
    return 'badge-' + (status || 'pending').toLowerCase();
  }
}
