import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '../../features/iam/services/authentication.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    return authService.isSignedIn.pipe(
        take(1),
        map(isSignedIn => {
            if (!isSignedIn) {
                console.log('Access denied - Redirecting to login');
                router.navigate(['/login']);
                return false;
            }
            return true;
        })
    );
};

