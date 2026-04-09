import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DriverService, DriverDetails } from '../../services/driver.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-order-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4 animate-fade">
      <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 class="display-5 fw-bold text-gradient ls-tight mb-0">Driver Command</h2>
          <p class="text-muted text-emerald small opacity-75">Fleet management and deployment</p>
        </div>
        <button class="btn-orb shadow-emerald" (click)="toggleAddForm()">
          <i class="bi" [class.bi-plus-lg]="!showAddForm" [class.bi-dash-lg]="showAddForm"></i>
        </button>
      </div>

      <!-- Add Driver Form -->
      <div *ngIf="showAddForm" class="glass-card p-5 mb-5 animate-slide">
        <h4 class="mb-4 text-white"><i class="bi bi-person-plus-fill me-3 text-emerald"></i>Provision New Unit</h4>
        <form (ngSubmit)="onSubmit()" #driverFormRef="ngForm">
          <div class="row g-4">
            <div class="col-lg-4">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Driver Identity</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-person"></i></span>
                   <input type="text" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.name" name="name" required placeholder="Full Name">
               </div>
            </div>
            <div class="col-lg-2">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Unit Age</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-calendar-event"></i></span>
                   <input type="number" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.age" name="age" required>
               </div>
            </div>
            <div class="col-lg-3">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Communication node (email)</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-envelope"></i></span>
                   <input type="email" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.email" name="email" required placeholder="pilot@fleet.tech">
               </div>
            </div>
            <div class="col-lg-3">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Tactical Contact</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-phone"></i></span>
                   <input type="text" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.contactNumber" name="contactNumber" required placeholder="+91 XXXX XXXX">
               </div>
            </div>

            <div class="col-lg-6">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Operational Base / QR</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-geo-alt"></i></span>
                   <textarea class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.address" name="address" required rows="1" placeholder="Detailed Address Registry"></textarea>
               </div>
            </div>
            <div class="col-lg-3">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">License credential</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-card-checklist"></i></span>
                   <input type="text" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.licenseNumber" name="licenseNumber" required placeholder="LN-XXXXXXXXXX">
               </div>
            </div>
            <div class="col-lg-3">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Tactical Access Key (Password)</label>
               <div class="input-group glass rounded-3 overflow-hidden">
                   <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-key"></i></span>
                   <input type="password" class="form-control bg-transparent border-0 text-white p-3" [(ngModel)]="driverForm.password" name="password" required placeholder="••••••••">
               </div>
            </div>

            <div class="col-lg-4">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Unit Visual Data (Profile)</label>
               <input type="file" class="form-control glass" (change)="onFileSelected($event, 'profile')">
            </div>
            <div class="col-lg-4">
               <label class="form-label ls-wide small fw-bold text-uppercase opacity-50">Credentials Scan (License)</label>
               <input type="file" class="form-control glass" (change)="onFileSelected($event, 'license')">
            </div>
            <div class="col-lg-4 d-flex align-items-end">
               <button type="submit" class="btn-premium w-100 py-3 rounded-pill h-100 mt-lg-0 mt-3" [disabled]="!driverFormRef.valid">
                  INITIALIZE DEPLOYMENT
               </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Drivers List -->
      <div class="glass-card p-0 border-glass overflow-hidden">
        <div class="p-5 border-bottom border-glass d-flex justify-content-between align-items-center">
            <h4 class="mb-0 text-white">Fleet Registry</h4>
            <span class="badge glass border-emerald text-emerald pulse-emerald">{{ drivers.length }} Units Operational</span>
        </div>
        <div class="table-responsive">
          <table class="table table-premium mb-0">
            <thead>
              <tr>
                <th class="ps-5">UNIT IDENTITY</th>
                <th>VEHICLE / RECO</th>
                <th>CONTACT</th>
                <th class="text-end pe-5">INTEL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let driver of drivers" class="animate-fade hover-row">
                <td class="ps-5">
                  <div class="d-flex align-items-center">
                    <div class="avatar-hub me-3 shadow-emerald">
                      <img *ngIf="driver.driverPhoto" [src]="driver.driverPhoto" class="w-100 h-100 object-fit-cover">
                      <span *ngIf="!driver.driverPhoto" class="text-emerald fw-bold">{{ driver.name?.charAt(0) }}</span>
                    </div>
                    <div>
                      <h6 class="mb-0 text-white fw-bold">{{ driver.name }}</h6>
                      <small class="text-muted small">Age: {{ driver.age || 'N/A' }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="small">
                    <span class="text-white fw-bold d-block">LN: {{ driver.licenseNumber }}</span>
                    <span class="text-muted opacity-75">{{ driver.address }}</span>
                  </div>
                </td>
                <td>
                    <div class="small">
                        <span class="text-emerald d-block"><i class="bi bi-phone me-1"></i> {{ driver.contactNumber }}</span>
                        <span class="text-muted opacity-50">{{ driver.email }}</span>
                    </div>
                </td>
                <td class="text-end pe-5">
                  <div class="d-flex justify-content-end gap-2">
                    <a *ngIf="driver.licensePhoto" [href]="driver.licensePhoto" target="_blank" class="btn-action-blue" title="View Document">
                       <i class="bi bi-file-earmark-pdf"></i>
                    </a>
                    <button class="btn-inspect">INSPECT NODE</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="drivers.length === 0">
                <td colspan="4" class="text-center p-5 text-muted opacity-50">
                   <i class="bi bi-broadcast display-4 d-block mb-3"></i>
                   No units currently deployed in field.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-orb {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #10b981;
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-orb:hover {
      transform: scale(1.1) rotate(90deg);
      background: #059669;
    }
    .hover-row:hover {
        background: rgba(255, 255, 255, 0.02);
    }
    .pulse-emerald {
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `]
})
export class OrderDriversComponent implements OnInit {
  drivers: DriverDetails[] = [];
  showAddForm = false;
  
  driverForm: any = {
    name: '',
    age: null,
    email: '',
    contactNumber: '',
    address: '',
    licenseNumber: '',
    password: 'DriverPassword@123'
  };
  
  selectedProfilePic: File | null = null;
  selectedLicensePhoto: File | null = null;
  
  constructor(
    private driverService: DriverService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers() {
    this.driverService.getAllDrivers().subscribe(drivers => {
      this.drivers = drivers;
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }

  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'profile') this.selectedProfilePic = file;
      if (type === 'license') this.selectedLicensePhoto = file;
    }
  }

  onSubmit() {
    this.driverService.registerDriver(this.driverForm).subscribe({
      next: (driver: any) => {
        const userId = driver.user.id;
        
        let pendingUploads = 0;
        const checkDone = () => {
          if (pendingUploads === 0) {
            this.toastService.success('Unit deployed successfully');
            this.showAddForm = false;
            this.loadDrivers();
            this.resetForm();
          }
        };

        if (this.selectedProfilePic) {
          pendingUploads++;
          this.driverService.uploadPhoto(userId, this.selectedProfilePic).subscribe(() => {
            pendingUploads--;
            checkDone();
          });
        }

        if (this.selectedLicensePhoto) {
          pendingUploads++;
          this.driverService.uploadLicense(userId, this.selectedLicensePhoto).subscribe(() => {
            pendingUploads--;
            checkDone();
          });
        }

        if (pendingUploads === 0) {
          checkDone();
        }
      },
      error: (err) => {
        if (err.status === 409) {
           this.toastService.error('Identity conflict: Unit already registered.');
        } else {
           this.toastService.error('Deployment failure: System link offline.');
        }
      }
    });
  }

  resetForm() {
      this.driverForm = { name: '', age: null, email: '', contactNumber: '', address: '', licenseNumber: '', password: 'DriverPassword@123' };
      this.selectedProfilePic = null;
      this.selectedLicensePhoto = null;
  }
}
