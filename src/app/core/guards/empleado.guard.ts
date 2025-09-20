import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const empleadoGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return toObservable(authService.currentUser).pipe(
    map(user => {
      if (user && (user.rol === 'Empleado' || user.rol === 'Admin')) {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};
