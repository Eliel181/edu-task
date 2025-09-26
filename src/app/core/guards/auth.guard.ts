import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {

  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  //   return toObservable(authService.currentUser).pipe(
  //   filter(user => user !== undefined),
  //   take(1),
  //   map(user => {
  //     if (user) {
  //       console.log('Usuario Autenticado (después de esperar): ', user);
  //       return true;
  //     } else {
  //       console.log('Usuario NO Autenticado (después de esperar): ', user);
  //       router.navigate(['/login']);
  //       return false;
  //     }
  //   })
  // );

  return toObservable(authService.currentUser).pipe(
    filter(user => user !== undefined),
    take(1), 
    map(user => {
      // debugger
      if (user && user.emailVerified) {
        console.log('Usuario autenticado y verificado: ', user);
        return true;
      } else {
        console.log('Usuario NO Autenticado o NO verificado. Redirigiendo a /login.');
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
