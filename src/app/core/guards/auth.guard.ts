import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  const user = await authService.ready; 

  if (user) {
    console.log('Usuario autenticado', user);
    return true;
  } else {
    console.log('Usuario NO autenticado', user);
    router.navigate(['/login']);
    return false;
  }
};
