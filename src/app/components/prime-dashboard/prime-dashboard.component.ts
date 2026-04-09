import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-prime-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prime-dashboard.component.html',
  styleUrls: ['./prime-dashboard.component.css']
})
export class PrimeDashboardComponent implements OnInit {
  activeTab = signal<string>('dashboard');
  user: any;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.storageService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.storageService.getUser();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
      error: err => console.log(err)
    });
  }
}
