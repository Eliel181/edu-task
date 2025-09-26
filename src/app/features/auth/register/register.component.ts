import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { delay } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  isSubmitting: boolean = false;
  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[&!@]).+$/)
      ]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      // Desestructurar para obtener el email
      const { email } = this.registerForm.value;
      // await this.authService.register(this.registerForm.value);
      const firebaseUser = await this.authService.register(this.registerForm.value);
      // this.isSubmitting = false;
      await this.authService.sendEmailVerification();
      
      sessionStorage.setItem('pendingVerificationEmail', email);
      
      this.router.navigate(['/verificar-email'], {
        state: { email: email }
      });

    } catch (error) {
      console.error('Error en el registro: ', error);
      alert('Hubo un error al registrar el usuario, Intenta de nuevo');
    } finally {
      this.isSubmitting = false;
    }
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get apellido() { return this.registerForm.get('apellido'); }
  get telefono() { return this.registerForm.get('telefono'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
}
