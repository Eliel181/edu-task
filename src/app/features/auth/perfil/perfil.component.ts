import { Component, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  public authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  // Usuario Actual
  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  profileForm: FormGroup;

  isSubmitting: boolean = false;
  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  constructor() {
    this.profileForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }],
      nombre: [''],
      apellido: [''],
      password: [''],
      telefono: [''],
      perfil: ['']
    });
  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      // rellena los campos del form con los datos del usuario
      this.profileForm.patchValue(user);
      this.imagenBase64Preview.set(user.perfil || null);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        this.imagenBase64Preview.set(result);
        this.profileForm.patchValue({ perfil: result });
        this.profileForm.markAsDirty();
      }
    }
  }

  async onSubmit(): Promise<void> {

    if (this.profileForm.invalid || !this.profileForm.dirty) {
      return;
    }
    const user = this.currentUser();
    if (!user) {
      console.error('No hay un usuario autenticado');
      return;
    }

    this.isSubmitting = true;
    try {
      const dataToUpdate = {
        nombre: this.profileForm.get('nombre')?.value,
        apellido: this.profileForm.get('apellido')?.value,
        telefono: this.profileForm.get('telefono')?.value,
        perfil: this.profileForm.get('perfil')?.value
      };


      await this.firestoreService.updateDocument('usuarios', user.uid, dataToUpdate);
      alert('Perfil actualizado');

      this.profileForm.markAsPristine();
    } catch (error) {
      console.error('Error a actualizar el perfil', error);
      alert('Error al actualizar el perfil, intente de nuevo');
    } finally {
      this.isSubmitting = false;
    }
  }
}
