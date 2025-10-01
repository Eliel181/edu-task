import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, MinLengthValidator, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { TaskService } from '../task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Tarea } from '../../../core/interfaces/tarea.model';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SpinnerOverlayComponent } from "../../../shared/spinner-overlay/spinner-overlay.component";
import { ActivityAction } from '../../../core/interfaces/activity-feed.model';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';


@Component({
  selector: 'app-edit-tarea',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SpinnerOverlayComponent],
  templateUrl: './edit-tarea.component.html',
  styleUrl: './edit-tarea.component.css'
})
export class EditTareaComponent implements OnInit, OnDestroy {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private taskService: TaskService = inject(TaskService);
  private authService: AuthService = inject(AuthService);
  private activityFeedService: ActivityFeedService = inject(ActivityFeedService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  public tareaForm!: FormGroup;
  public tareaFormEdicion!: FormGroup;

  public empleados = signal<Usuario[]>([]);
  public tareaSeleccionadaParaEditar = signal<Tarea | null>(null);
  private destroy$ = new Subject<void>();

  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  get isEditMode(): boolean {
    return this.tareaSeleccionadaParaEditar() !== null;
  }

  constructor() {
    this.tareaForm = this.formBuilder.group({
      titulo: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      asignadoA: ['', Validators.required],
      prioridad: ['', Validators.required],
      fechaDeVencimiento: ['']
    });

    this.tareaFormEdicion = this.formBuilder.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      asignadoA: ['', Validators.required],
      fechaDeVencimiento: [''],
      estado: ['Pendiente', Validators.required],
      prioridad: ['Media', Validators.required],
      progreso: [0]
    });
  }

  ngOnInit(): void {
    this.cargarEmpleados();

    const tareaId = this.route.snapshot.paramMap.get('id');
    if (tareaId && tareaId !== 'new') {
      console.log('CargarTareaParaEditar()');

      this.cargarTareaParaEditar(tareaId);
    } else {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpleados(): void {
    this.taskService.getEmpleados().pipe(takeUntil(this.destroy$)).subscribe(emps => {
      this.empleados.set(emps);
      console.log(emps);

      this.cdr.detectChanges();
      if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
      }
    });
  }

  cargarTareaParaEditar(id: string): void {
    this.isLoading.set(true);
    this.taskService.getTareaById(id).pipe(takeUntil(this.destroy$)).subscribe(tarea => {
      if (tarea) {
        this.tareaSeleccionadaParaEditar.set(tarea);
        const fechaVencimiento = tarea.fechaDeVencimiento
          ? (tarea.fechaDeVencimiento as Timestamp).toDate().toISOString().split('T')[0]
          : '';
        this.tareaFormEdicion.setValue({
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          asignadoA: tarea.asignadoA,
          fechaDeVencimiento: fechaVencimiento,
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          progreso: tarea.progreso
        });
        this.tareaFormEdicion.markAsPristine();
      } else {
        console.error('Tarea no encontrada con ID:', id);
        this.router.navigate(['administracion/gestion-tareas']); // Ajusta a tu ruta de listado
      }
      this.isLoading.set(false);
    });
  }

  async crearTarea(): Promise<void> {
    if (this.tareaForm.invalid) {
      this.tareaForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const admin = this.authService.currentUser();
    if (!admin) {
      console.error('No hay el admin autenticado');
      return;
    }
    const empleadoSeleccionado = this.empleados().find(emp => emp.uid === this.tareaForm.value.asignadoA);
    if (!empleadoSeleccionado) {
      console.error('Empleado no encontrado');
      this.isSubmitting.set(false);
      return;
    }
    const nombreCompleto = `${empleadoSeleccionado.apellido} ${empleadoSeleccionado.nombre}`;
    const formValue = this.tareaForm.value;

    const nuevaTarea: Partial<Tarea> = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      asignadoA: formValue.asignadoA,
      asignadoPor: admin.uid,
      fotoEmpleadoAsignado: empleadoSeleccionado.perfil!,
      nombreEmpleadoAsignado: nombreCompleto,
      estado: 'Pendiente',
      prioridad: formValue.prioridad,
      progreso: 0,
      fechaDeCreacion: Timestamp.now()
    };
    if (formValue.fechaDeVencimiento && formValue.fechaDeVencimiento.trim() !== '') {
      // Al añadir 'T00:00:00', forzamos a que se interprete como la medianoche local
      const fechaLocal = new Date(formValue.fechaDeVencimiento + 'T00:00:00');
      nuevaTarea.fechaDeVencimiento = Timestamp.fromDate(fechaLocal);
    }

    try {
      const tareaRef = await this.taskService.crearTarea(nuevaTarea);

      // SOLUCIÓN: Usar formValue.titulo en lugar de tarea.titulo
      await this.registrarActividadCreacionTarea(admin, tareaRef.id, formValue.titulo, empleadoSeleccionado);

      Swal.fire({
        title: 'Tarea creada!!',
        icon: 'success',
        text: 'La tarea se ha creado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      this.router.navigate(['administracion/gestion-tareas']);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      Swal.fire({
        title: 'Error',
        icon: 'error',
        text: 'No se pudo crear la tarea'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async guardarCambios(): Promise<void> {
    if (this.tareaFormEdicion.invalid || !this.tareaSeleccionadaParaEditar()) {
      return;
    }

    this.isSubmitting.set(true);
    const tareaActual = this.tareaSeleccionadaParaEditar()!;

    if (!tareaActual.id) {
      console.error('Tarea no encontrada para editar');
      this.isSubmitting.set(false);
      return;
    }

    const admin = this.authService.currentUser();
    if (!admin) {
      console.error('No hay admin autenticado');
      this.isSubmitting.set(false);
      return;
    }

    const formValue = this.tareaFormEdicion.value;
    const datosParaActualizar: Partial<Tarea> = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      asignadoA: formValue.asignadoA,
      estado: formValue.estado,
      prioridad: formValue.prioridad,
      fechaDeActualizacion: Timestamp.now()
    };

    // Manejar progreso según estado
    if (formValue.estado === 'Pendiente') {
      datosParaActualizar.progreso = 0;
    } else if (formValue.estado === 'Finalizada') {
      datosParaActualizar.progreso = 100;
    } else {
      datosParaActualizar.progreso = Number(formValue.progreso);
    }

    const empleadoSeleccionado = this.empleados().find(e => e.uid === formValue.asignadoA);
    if (empleadoSeleccionado) {
      datosParaActualizar.nombreEmpleadoAsignado = `${empleadoSeleccionado.apellido} ${empleadoSeleccionado.nombre}`;
      datosParaActualizar.fotoEmpleadoAsignado = empleadoSeleccionado.perfil;
    }

    if (formValue.fechaDeVencimiento && formValue.fechaDeVencimiento.trim() !== '') {
      const fechaLocal = new Date(formValue.fechaDeVencimiento + 'T00:00:00');
      datosParaActualizar.fechaDeVencimiento = Timestamp.fromDate(fechaLocal);
    } else {
      datosParaActualizar.fechaDeVencimiento = null;
    }

    try {
      await this.taskService.actualizarTareaCompleta(tareaActual.id, datosParaActualizar);

      // Registrar actividad de edición
      await this.registrarActividadEdicionTarea(admin, tareaActual, datosParaActualizar);

      Swal.fire({
        title: 'Tarea actualizada!!',
        icon: 'success',
        text: 'La tarea se ha actualizado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      this.router.navigate(['administracion/gestion-tareas']);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      Swal.fire({
        title: 'Error',
        icon: 'error',
        text: 'No se pudo actualizar la tarea'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async registrarActividadCreacionTarea(
    admin: Usuario,
    tareaId: string,
    tituloTarea: string,
    empleado: Usuario
  ): Promise<void> {
    const accion: ActivityAction = 'task_created';
    const nombreEmpleado = `${empleado.nombre} ${empleado.apellido}`;

    await this.activityFeedService.logActivity({
      actorId: admin.uid,
      actorName: `${admin.nombre} ${admin.apellido}`,
      actorImage: admin.perfil,
      action: accion,
      entityType: 'task',
      entityId: tareaId,
      entityDescription: tituloTarea, // Usamos el título del formulario
      details: `${admin.nombre} ${admin.apellido} creó la tarea "${tituloTarea}" para ${nombreEmpleado}`
    });
  }

  private async registrarActividadEdicionTarea(admin: Usuario, tareaOriginal: Tarea, cambios: Partial<Tarea>): Promise<void> {
    const accion: ActivityAction = 'task_updated'; // O puedes crear 'task_updated'

    // Detectar cambios específicos
    const cambiosDetallados: string[] = [];

    if (tareaOriginal.titulo !== cambios.titulo) {
      cambiosDetallados.push(`título de "${tareaOriginal.titulo}" a "${cambios.titulo}"`);
    }

    if (tareaOriginal.estado !== cambios.estado) {
      cambiosDetallados.push(`estado de "${tareaOriginal.estado}" a "${cambios.estado}"`);
    }

    if (tareaOriginal.prioridad !== cambios.prioridad) {
      cambiosDetallados.push(`prioridad de "${tareaOriginal.prioridad}" a "${cambios.prioridad}"`);
    }

    if (tareaOriginal.asignadoA !== cambios.asignadoA) {
      const nuevoEmpleado = this.empleados().find(e => e.uid === cambios.asignadoA);
      if (nuevoEmpleado) {
        cambiosDetallados.push(`asignación a ${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido}`);
      }
    }

    const detalles = cambiosDetallados.length > 0
      ? `Cambió ${cambiosDetallados.join(', ')}`
      : 'Actualizó la tarea';

    await this.activityFeedService.logActivity({
      actorId: admin.uid,
      actorName: `${admin.nombre} ${admin.apellido}`,
      actorImage: admin.perfil,
      action: accion,
      entityType: 'task',
      entityId: tareaOriginal.id,
      entityDescription: cambios.titulo || tareaOriginal.titulo,
      details: `${admin.nombre} ${admin.apellido} ${detalles}`
    });
  }

  get titulo() { return this.tareaForm.get('titulo'); }
  get descripcion() { return this.tareaForm.get('descripcion'); }
  get asignadoA() { return this.tareaForm.get('asignadoA'); }
  get prioridad() { return this.tareaForm.get('prioridad'); }
  get fechaDeVencimiento() { return this.tareaForm.get('fechaDeVencimiento'); }

  prioridades = [
    { value: 'Baja', label: 'Baja', colorClass: 'bg-[#2ecc71]' },
    { value: 'Media', label: 'Media', colorClass: 'bg-[#f39c12]' },
    { value: 'Alta', label: 'Alta', colorClass: 'bg-[#e74c3c]' },
    { value: 'Urgente', label: 'Urgente', colorClass: 'bg-[#e91e63]' }
  ];
}
