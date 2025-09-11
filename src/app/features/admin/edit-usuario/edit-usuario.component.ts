import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RolUsuario, Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-usuario',
  imports: [CommonModule,RouterModule, ReactiveFormsModule],
  templateUrl: './edit-usuario.component.html',
  styleUrl: './edit-usuario.component.css'
})
export class EditUsuarioComponent implements OnInit{
  private firestoreService:FirestoreService = inject(FirestoreService);
  private formBuilder:FormBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  public authService:AuthService = inject(AuthService);

  router:Router = inject(Router);

  // Usuario Actual
  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  profileForm: FormGroup;

  isSubmitting: boolean = false;
  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  constructor(){
    this.profileForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }],
      nombre: [{ value: '', disabled: true }],
      apellido: [{ value: '', disabled: true }],
      password: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      rol: [''],
      perfil: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    const usuarioId = this.route.snapshot.paramMap.get('id');
    if (!usuarioId) {
      return;
    }

    this.firestoreService.getDocumentById<Usuario>('usuarios', usuarioId).then(
      data => {
        if(data){
          this.profileForm.patchValue(data);
          this.imagenBase64Preview.set(data.perfil || null)
        }
      }
    );
  }


  actualizarUsuario(){
    const usuarioId = this.route.snapshot.paramMap.get('id');

    if(!usuarioId){
      return;
    }

    const { rol } = this.profileForm.value;
    console.log(rol);


    this.firestoreService.updateDocument('usuarios', usuarioId, { rol: rol });
      Swal.fire({
        title: '¡Actualizo!',
        text: 'Rol del Usuario Actualizada Correctamente',
        icon: 'success'
      });

    this.router.navigate(['/gestion-usuarios'])
  }

}
