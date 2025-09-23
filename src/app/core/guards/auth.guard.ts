import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { Usuario } from '../interfaces/usuario.model';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  // return toObservable(authService.currentUser).pipe(
  //   // Ignorar valores indefinidos
  //   filter((user): user is Usuario | null => user !== undefined),
  //   map(user => {
  //     if (user) {
  //       console.log('Usuario autenticado', user);
        
  //       return true; // usuario logueado
  //     } else {
  //       console.log('Usuario NO autenticado', user);
  //       router.navigate(['/login']); // no logueado
  //       return false;
  //     }
  //   })
  // );

  const user = await authService.ready; // espera al primer valor de Firebase

  if (user) {
    console.log('Usuario autenticado', user);
    return true;
  } else {
    console.log('Usuario NO autenticado', user);
    router.navigate(['/login']);
    return false;
  }
};
