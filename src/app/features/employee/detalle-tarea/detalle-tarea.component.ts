import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../tasks/task.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { EstadoTarea, Tarea } from '../../../core/interfaces/tarea.model';
import { Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';
import { ActivityAction } from '../../../core/interfaces/activity-feed.model';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';

@Component({
  selector: 'app-detalle-tarea',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detalle-tarea.component.html',
  styleUrl: './detalle-tarea.component.css'
})
export class DetalleTareaComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private tareasService: TaskService = inject(TaskService);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private authService: AuthService = inject(AuthService);
  private activityFeedService: ActivityFeedService = inject(ActivityFeedService);

  tarea = signal<Tarea | undefined>(undefined);
  adminAsignador = signal<Usuario | undefined>(undefined);
  progresoActual = 0;

  isSubmitting = signal<boolean>(false);
  estadoOriginal: EstadoTarea | undefined;
  pendingChanges = signal<boolean>(false);
  private estadoOriginalSet = false;

  ngOnInit(): void {
    const tareaId = this.route.snapshot.paramMap.get('id');
    if (tareaId) {
      this.tareasService.getTareaById(tareaId)
        .subscribe(t => {
          if (t) {
            this.tarea.set(t);
            this.progresoActual = t.progreso;
            if (!this.estadoOriginalSet) {
              this.estadoOriginal = t.estado;
              this.estadoOriginalSet = true;
            }
            
            if (t.asignadoPor) {
              this.firestoreService.getDocumentById<Usuario>('usuarios', t.asignadoPor).then(user => {
                if (user) {
                  this.adminAsignador.set(user);
                } else {
                  console.error('Admin no encontrado con UID:', t.asignadoPor);
                }
              });
            }
          }
        });
    }
  }


actualizarEstado(nuevoEstado: EstadoTarea): void {
  const tareaActual = this.tarea();
  if (!tareaActual) return;
  
  const prevProgreso = tareaActual.progreso ?? 0;
  let nuevoProgreso = this.progresoActual;
  
  if (nuevoEstado === 'Pendiente') nuevoProgreso = 0;
  if (nuevoEstado === 'Finalizada') nuevoProgreso = 100;

    // Actualizamos localmente
    this.tarea.update(t => t ? ({ ...t, estado: nuevoEstado, progreso: nuevoProgreso }) : undefined);
    this.progresoActual = nuevoProgreso;
    
    // Comparamos con el estadoOriginal
    const changed = (this.estadoOriginal !== nuevoEstado) || (prevProgreso !== nuevoProgreso);
    this.pendingChanges.set(changed);
    
}


  actualizarProgreso(): void {
    const tareaActual = this.tarea();
    if (!tareaActual || tareaActual.estado !== 'En Proceso') return;

    let progresoVal = this.progresoActual;
    if (progresoVal < 1) progresoVal = 1;
    if (progresoVal > 99) progresoVal = 99;
    const prevProgreso = tareaActual.progreso ?? 0;

    this.progresoActual = progresoVal;

    // Solo actualizamos localmente
    this.tarea.update(t => t ? ({ ...t, progreso: progresoVal }) : undefined);
    this.pendingChanges.set(prevProgreso !== progresoVal || this.estadoOriginal !== tareaActual.estado);
  }

guardarCambios(): void {
  const tareaActual = this.tarea();
  if (!tareaActual || !tareaActual.id || this.estadoOriginal === undefined) return;
  this.isSubmitting.set(true);
  const datosNuevos = {
    titulo: tareaActual.titulo,
    estado: tareaActual.estado,
    progreso: tareaActual.progreso
  };

    this.tareasService.updateTarea(tareaActual.id, datosNuevos)
      .then(async () => {
        const actor = this.authService.currentUser();
        if (!actor) return;

        // SOLUCIÓN PRINCIPAL: Usar una variable temporal para la comparación
        const estadoAnterior = this.estadoOriginal;
        const estadoNuevo = tareaActual.estado;


        if (estadoAnterior !== estadoNuevo) {
          
          let accion: ActivityAction;
          let detalle: string;

          if (estadoNuevo === 'En Proceso') {
            accion = 'task_started';
            detalle = `${actor.nombre} ${actor.apellido} empezó la tarea "${tareaActual.titulo}"`;
          } else if (estadoNuevo === 'Finalizada') {
            accion = 'task_finished';
            detalle = `${actor.nombre} ${actor.apellido} finalizó la tarea "${tareaActual.titulo}"`;
          } else {
            accion = 'task_updated';
            detalle = `${actor.nombre} ${actor.apellido} actualizó la tarea "${tareaActual.titulo}"`;
          }

          await this.activityFeedService.logActivity({
            actorId: actor.uid,
            actorName: `${actor.nombre} ${actor.apellido}`,
            actorImage: actor.perfil,
            action: accion,
            entityType: 'task',
            entityId: tareaActual.id,
            entityDescription: tareaActual.titulo,
            details: detalle
          });

          
          // Actualizamos el estado original SOLO después de guardar exitosamente
          this.estadoOriginal = estadoNuevo;
        } 

        this.pendingChanges.set(false);

        Swal.fire({
          title: '¡Tarea actualizada!',
          icon: 'success',
          text: 'Los cambios fueron guardados exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });

    }).catch(err => {
      Swal.fire('Error', 'Ocurrió un error al guardar la tarea.', 'error');
    }).finally(() => {
      this.isSubmitting.set(false);
      this.router.navigate(['/administracion/mis-tareas']);
    });
}


}

