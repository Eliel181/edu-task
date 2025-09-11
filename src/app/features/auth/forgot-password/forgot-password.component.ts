import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  resetForm: FormGroup;
  isSubmitting = false;
  message: string | null = null;

  constructor() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.message = null;

    try {
      const { email } = this.resetForm.value;
      await this.authService.resetPassword(email);
          Swal.fire({
      icon: 'success',
      title: '¡Correo enviado!',
      html: `Se ha enviado un enlace de recuperación a <strong class="text-blue-600">${email}</strong>.`,
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#2563eb', 
      background: '#f9fafb', 
      customClass: {
        popup: 'rounded-lg shadow-xl',
        confirmButton: 'px-4 py-2 rounded-md font-medium'
      }
    });
    } catch (error: any) {
      this.message = error.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  
  get email() { return this.resetForm.get('email'); }
}
