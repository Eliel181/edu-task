import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return toObservable(authService.currentUser).pipe(
    filter(user => user !== undefined), 
    take(1), 
    map(user => {
      // debugger
      if (user && user.emailVerified) {
        console.log('PublicGuard: Usuario autenticado, redirigiendo a /administracion');
        router.navigate(['/administracion']);
        return false; 
      } else {
        console.log('PublicGuard: Usuario NO autenticado, permitiendo acceso a ruta pública.');
        return true; 
      }
    })
  );
};
