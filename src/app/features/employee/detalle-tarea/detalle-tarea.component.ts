import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../tasks/task.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { EstadoTarea, Tarea } from '../../../core/interfaces/tarea.model';
import { Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';

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

  tarea = signal<Tarea | undefined>(undefined);
  adminAsignador = signal<Usuario | undefined>(undefined);
  progresoActual = 0;

  isSubmitting = signal<boolean>(false);
  private estadoOriginal: EstadoTarea | undefined;

  ngOnInit(): void {
    const tareaId = this.route.snapshot.paramMap.get('id');
    if (tareaId) {
      this.tareasService.getTareaById(tareaId)
        .subscribe(t => {
          if (t) {
            this.tarea.set(t);
            this.progresoActual = t.progreso;
            this.estadoOriginal = t.estado;
            if (t.asignadoPor) {
              this.firestoreService.getDocumentById<Usuario>('usuarios', t.asignadoPor).then(user => {
                if (user) {
                  this.adminAsignador.set(user);
                  console.log('Datos del usuario que asigno la tarea (admin): ', user);
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

    let nuevoProgreso = this.progresoActual;
    if (nuevoEstado === 'Pendiente') nuevoProgreso = 0;
    if (nuevoEstado === 'Finalizada') nuevoProgreso = 100;

    // Solo actualizamos localmente
    this.tarea.update(t => t ? ({ ...t, estado: nuevoEstado, progreso: nuevoProgreso }) : undefined);
    this.progresoActual = nuevoProgreso;
  }

  actualizarProgreso(): void {
    const tareaActual = this.tarea();
    if (!tareaActual || tareaActual.estado !== 'En Proceso') return;

    let progresoVal = this.progresoActual;
    if (progresoVal < 1) progresoVal = 1;
    if (progresoVal > 99) progresoVal = 99;

    this.progresoActual = progresoVal;

    // Solo actualizamos localmente
    this.tarea.update(t => t ? ({ ...t, progreso: progresoVal }) : undefined);
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

    this.tareasService.updateTaskAndLogActivity(
      tareaActual.id,
      this.estadoOriginal, 
      datosNuevos          
    ).then(() => {
      Swal.fire({
        title: '¡Tarea actualizada!',
        icon: 'success',
        text: 'Los cambios fueron guardados exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
      this.estadoOriginal = tareaActual.estado;
    }).catch(err => {
      console.error('Error al guardar tarea con actividad:', err);
      Swal.fire('Error', 'Ocurrió un error al guardar la tarea.', 'error');
    }).finally(() => {
     this.isSubmitting.set(false);
     this.router.navigate(['/administracion/mis-tareas']);
    });
  }
}

