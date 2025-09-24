import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verificar-email',
  imports: [],
  templateUrl: './verificar-email.component.html',
  styleUrl: './verificar-email.component.css'
})
export class VerificarEmailComponent {
  private router: Router = inject(Router);
  email: string = '';
  
  constructor() {
    // Obtener el email desde sessionStorage
    
    this.email = sessionStorage.getItem('pendingVerificationEmail') || '';
    // si no hay email redirigimos
    if (!this.email) {
      this.router.navigate(['login']);
    }
  }

  volverLogin() {
    // Limpiamos el sessionStorage
    sessionStorage.removeItem('pendingVerificationEmail');
    this.router.navigate(['login']);
  }
}
