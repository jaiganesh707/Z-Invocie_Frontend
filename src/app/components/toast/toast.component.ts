import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000">
      <div *ngFor="let toast of toastService.toasts | async" 
           class="toast show glass border-glass mb-2 animate-slide-right" 
           [ngClass]="getToastClass(toast.type)"
           role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex align-items-center p-3">
          <div class="toast-icon me-3">
            <i class="bi" [ngClass]="getIconClass(toast.type)"></i>
          </div>
          <div class="toast-body p-0 flex-grow-1 text-white fw-medium">
            {{ toast.message }}
          </div>
          <button type="button" class="btn-close btn-close-white ms-2 shadow-none" 
                  (click)="toastService.remove(toast.id)" aria-label="Close"></button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .toast-container { transition: all 0.3s ease; }
    .toast {
      min-width: 300px;
      border-radius: 12px;
      backdrop-filter: blur(15px);
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .toast.success { border-left: 4px solid var(--success); }
    .toast.error { border-left: 4px solid var(--accent); }
    .toast.warning { border-left: 4px solid var(--warning); }
    .toast.info { border-left: 4px solid var(--primary); }

    .toast-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .success .toast-icon { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .error .toast-icon { background: rgba(244, 63, 94, 0.1); color: var(--accent); }
    .warning .toast-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .info .toast-icon { background: rgba(99, 102, 241, 0.1); color: var(--primary); }

    @keyframes slideRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-right {
      animation: slideRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `]
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }

    getToastClass(type: Toast['type']) {
        return type;
    }

    getIconClass(type: Toast['type']) {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-exclamation-octagon-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'info': return 'bi-info-circle-fill';
            default: return 'bi-info-circle-fill';
        }
    }
}
