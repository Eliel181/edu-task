import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return toObservable(authService.currentUser).pipe(
    map(user => {
      if (user && user.rol === 'Admin') {
        console.log('Permiso concedido');
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};
