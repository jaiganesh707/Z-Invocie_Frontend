import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit {
  constructor(private router: Router, private storageService: StorageService) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.redirectToDashboard();
    }
  }

  redirectToDashboard(): void {
    const user = this.storageService.getUser();
    const role: string = user?.role ?? '';
    const userId: number = user?.id;

    switch (role) {
      // ── Prime User → Stakeholder Hub (their billing terminal)
      case 'ROLE_PRIME_USER':
        this.router.navigate(['/prime-dashboard']);
        break;

      // ── Super Admin → Admin control panel
      case 'ROLE_SUPER_ADMIN':
        this.router.navigate(['/super-admin']);
        break;

      // ── Approver → Approval Terminal
      case 'ROLE_APPROVER':
        this.router.navigate(['/prime-dashboard']);
        break;

      // ── HR → HR Hub
      case 'ROLE_HR':
        this.router.navigate(['/hr-hub']);
        break;

      // ── Invoice Creator (Workflow User) → Personal Invoice Dashboard
      case 'ROLE_WORKFLOW_USER':
        this.router.navigate(['/workflow-dashboard']);
        break;

      // ── Management / Supervisor → Prime Dashboard
      case 'ROLE_MANAGEMENT':
      case 'ROLE_SUPERVISOR':
        this.router.navigate(['/prime-dashboard']);
        break;

      // ── Driver → Driver Dashboard
      case 'ROLE_DRIVER':
        this.router.navigate(['/driver-dashboard']);
        break;

      // ── Default (regular user / unknown role) → User Billing Terminal
      default:
        this.router.navigate(['/user-billing', userId]);
        break;
    }
  }
}
