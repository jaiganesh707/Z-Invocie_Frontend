import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryOrderService, DeliveryOrder, DeliveryStatus } from '../../services/delivery-order.service';
import { DriverService, DriverDetails } from '../../services/driver.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-delivery-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="delivery-card glass-card p-4">
      <h3 class="fw-bold mb-3"><i class="bi bi-truck me-2"></i> Book Delivery</h3>
      
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label">Shop Name</label>
          <input type="text" class="form-control" [(ngModel)]="order.shopName" placeholder="Enter shop name">
        </div>
        <div class="col-12">
          <label class="form-label">Shop Details / Address</label>
          <textarea class="form-control" [(ngModel)]="order.shopDetails" placeholder="Where should the driver pick up from?"></textarea>
        </div>
        <div class="col-12">
          <label class="form-label">Select Driver</label>
          <select class="form-select" [(ngModel)]="order.driverId">
            <option [ngValue]="undefined">Auto-assign nearest</option>
            <option *ngFor="let d of availableDrivers" [ngValue]="d.userId">
              {{ d.name }} ({{ d.bikeNo }})
            </option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">Pickup Message for Driver</label>
          <input type="text" class="form-control" [(ngModel)]="order.pickupMessage" placeholder="e.g. Please pick up Order #123">
        </div>
        <div class="col-12 mt-4">
          <button (click)="bookDelivery()" class="btn btn-primary w-100 py-2 rounded-pill">
            <i class="bi bi-send-fill me-2"></i> SEND PICKUP REQUEST
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .delivery-card {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class DeliveryBookingComponent implements OnInit {
  @Input() customerId!: number;
  order: DeliveryOrder = { shopName: '', shopDetails: '', pickupMessage: '' };
  availableDrivers: DriverDetails[] = [];

  constructor(
    private deliveryService: DeliveryOrderService,
    private driverService: DriverService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.driverService.getAllDrivers().subscribe(drivers => {
      this.availableDrivers = drivers;
    });
  }

  bookDelivery() {
    if (!this.order.shopName || !this.order.shopDetails) {
      this.toastService.show('Please enter shop details', 'warning');
      return;
    }
    this.order.customerId = this.customerId;
    this.deliveryService.createOrder(this.order).subscribe(() => {
      this.toastService.show('Delivery request sent to driver!', 'success');
      this.order = { shopName: '', shopDetails: '', pickupMessage: '' };
    });
  }
}
