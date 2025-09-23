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
        return true;
      } else if (user) {
        // Usuario logueado pero no admin -> redirigir a su ruta permitida
        router.navigate(['/administracion']); // por ejemplo
        return false;
      } else {
        // Usuario no logueado -> ir a login
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
