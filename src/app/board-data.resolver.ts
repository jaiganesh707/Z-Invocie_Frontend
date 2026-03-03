import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { UserService } from './services/user.service';

export const boardDataResolver: ResolveFn<any> = (): Observable<any> => {
    const userService = inject(UserService);
    return forkJoin({
        users: userService.reloadUsers(),
        roles: userService.reloadRoles()
    });
};
