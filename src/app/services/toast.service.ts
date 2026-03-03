import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts$ = new BehaviorSubject<Toast[]>([]);
    public toasts = this.toasts$.asObservable();
    private idCounter = 0;

    show(message: string, type: Toast['type'] = 'info') {
        const id = this.idCounter++;
        const toast: Toast = { message, type, id };
        const currentToasts = this.toasts$.value;
        this.toasts$.next([...currentToasts, toast]);

        setTimeout(() => {
            this.remove(id);
        }, 5000);
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    remove(id: number) {
        const filtered = this.toasts$.value.filter(t => t.id !== id);
        this.toasts$.next(filtered);
    }
}
