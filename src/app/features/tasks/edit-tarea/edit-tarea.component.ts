import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { TaskService } from '../task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Tarea } from '../../../core/interfaces/tarea.model';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';


declare const HSStaticMethods: any;

@Component({
  selector: 'app-edit-tarea',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './edit-tarea.component.html',
  styleUrl: './edit-tarea.component.css'
})
export class EditTareaComponent implements OnInit, OnDestroy {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private taskService: TaskService = inject(TaskService);
  private authService: AuthService = inject(AuthService);
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
      descripcion: ['', Validators.required],
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
      prioridad:  ['Media', Validators.required],
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
        this.router.navigate(['/gestion-tareas']); // Ajusta a tu ruta de listado
      }
      this.isLoading.set(false);
    });
  }

  crearTarea(): void {
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
      return;
    }
    const nombreCompleto = `${empleadoSeleccionado.apellido} ${empleadoSeleccionado.nombre}`;
    const formValue = this.tareaForm.value;
    const nuevaTarea: any = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      asignadoA: formValue.asignadoA,
      asignadoPor: admin.uid,
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
    this.taskService.crearTarea(nuevaTarea).then(() => {
      Swal.fire({
        title: 'Tarea creada!!', icon: 'success', text: 'La tarea se ha creado exitosamente',
        timer: 2000, showConfirmButton: false
      });
      this.router.navigate(['/gestion-tareas']);
    }).catch(error => {
      Swal.fire({ title: 'Error', icon: 'error', text: 'No se pudo crear la tarea' });
    }).finally(() => {
      this.isSubmitting.set(false);
    });
  }

  guardarCambios(): void {
    if (this.tareaFormEdicion.invalid || !this.tareaSeleccionadaParaEditar()) {
      return;
    }
    this.isSubmitting.set(true);
    const tareaActual = this.tareaSeleccionadaParaEditar()!;
    if (!tareaActual.id) {
      console.error('Tarea no encontrada para editar');
      return;
    }
    const formValue = this.tareaFormEdicion.value;
    const datosParaActualizar: Partial<Tarea> = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      asignadoA: formValue.asignadoA,
      estado: formValue.estado,
      prioridad: formValue.prioridad
    };
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
    }


    if (formValue.fechaDeVencimiento && formValue.fechaDeVencimiento.trim() !== '') {
      const fechaLocal = new Date(formValue.fechaDeVencimiento + 'T00:00:00');
      datosParaActualizar.fechaDeVencimiento = Timestamp.fromDate(fechaLocal);
    } else {
      datosParaActualizar.fechaDeVencimiento = null;
    }


    this.taskService.actualizarTareaCompleta(tareaActual.id, datosParaActualizar).then(() => {
      Swal.fire({
        title: 'Tarea actualizada!!', icon: 'success', text: 'La tarea se ha actualizado exitosamente',
        timer: 2000, showConfirmButton: false
      });
      this.router.navigate(['/gestion-tareas']);
    }).catch(error => {
      Swal.fire({ title: 'Error', icon: 'error', text: 'No se pudo actualizar la tarea' });
    }).finally(() => {
      this.isSubmitting.set(false);
    });
  }


}
