import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RolUsuario, Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';

@Component({
  selector: 'app-edit-usuario',
  imports: [CommonModule,RouterModule, ReactiveFormsModule],
  templateUrl: './edit-usuario.component.html',
  styleUrl: './edit-usuario.component.css'
})
export class EditUsuarioComponent implements OnInit{
  private firestoreService:FirestoreService = inject(FirestoreService);
    private activityFeedService: ActivityFeedService = inject(ActivityFeedService);
  private formBuilder:FormBuilder = inject(FormBuilder);
  route = inject(ActivatedRoute);
  public authService:AuthService = inject(AuthService);

  router:Router = inject(Router);

  // Usuario que se está editando
  usuarioData: Usuario | null = null;
  profileForm: FormGroup;

  isSubmitting = signal<boolean>(false);
  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  constructor(){
    this.profileForm = this.formBuilder.group({
      rol: ['']
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
          this.usuarioData = data; // Guardar los datos del usuario
          this.profileForm.patchValue({
            rol: data.rol // Solo el rol va al formulario
          });
          this.imagenBase64Preview.set(data.perfil || null)
        }
      }
    );
  }

  async actualizarUsuario(): Promise<void> {
    const usuarioId = this.route.snapshot.paramMap.get('id');

    if(!usuarioId){
      return;
    }
        const admin = this.authService.currentUser();
    if (!admin) {
      return;
    }

    this.isSubmitting.set(true);
    const { rol } = this.profileForm.value;

  try {
      // Obtener usuario actual para comparar el rol anterior
      const usuarioActual = await this.firestoreService.getDocumentById<Usuario>('usuarios', usuarioId);
      
      if (!usuarioActual) {
        Swal.fire('Error', 'Usuario no encontrado', 'error');
        return;
      }

      const rolAnterior = usuarioActual.rol;

      // Actualizar en Firestore
      await this.firestoreService.updateDocument('usuarios', usuarioId, { rol });

      // Registrar actividad de cambio de rol
      await this.registrarActividadCambioRol(admin, usuarioActual, rolAnterior, rol);

      Swal.fire({
        title: '¡Actualizado!',
        text: 'Rol del Usuario Actualizado Correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      this.router.navigate(['/administracion/gestion-usuarios']);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }
    private async registrarActividadCambioRol(
    admin: Usuario, 
    usuario: Usuario, 
    rolAnterior: RolUsuario, 
    rolNuevo: RolUsuario
  ): Promise<void> {
    await this.activityFeedService.logActivity({
      actorId: admin.uid,
      actorName: `${admin.nombre} ${admin.apellido}`,
      actorImage: admin.perfil,
      action: 'role_changed',
      entityType: 'user',
      entityId: usuario.uid,
      entityDescription: `${usuario.nombre} ${usuario.apellido}`,
      details: `${admin.nombre} ${admin.apellido} cambió el rol de "${usuario.nombre} ${usuario.apellido}" de "${rolAnterior}" a "${rolNuevo}"`
    });
  }
}
