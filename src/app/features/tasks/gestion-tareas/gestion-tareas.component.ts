import { ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Timestamp } from 'firebase/firestore';
import { TaskService } from '../task.service';
import { EstadoTarea, Tarea } from '../../../core/interfaces/tarea.model';

@Component({
  selector: 'app-gestion-tareas',
  imports: [],
  templateUrl: './gestion-tareas.component.html',
  styleUrl: './gestion-tareas.component.css'
})
export class GestionTareasComponent implements OnInit, OnDestroy {
  private taskService: TaskService = inject(TaskService);

  public empleados = signal<Usuario[]>([]);
  private allTasks = signal<Tarea[]>([]);
  public isLoading = signal(true);

  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  public filtroEmpleado = signal<string>('todos'); 
  public filtroEstado = signal<EstadoTarea | 'todos'>('todos');

  terminoBusqueda = signal('');

  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  public tareasFiltradas: Signal<Tarea[]> = computed(() => {
    const tasks = this.allTasks();
    const employeeId = this.filtroEmpleado();
    const status = this.filtroEstado();
    const terminoNormalizado = this.normalizarTexto(this.terminoBusqueda());

    return tasks.filter(tarea => {
      const matchEmpleado = (employeeId === 'todos' || tarea.asignadoA === employeeId);

      const matchEstado = (status === 'todos' || tarea.estado === status);

      const matchBusqueda = terminoNormalizado === '' ||
        this.normalizarTexto(tarea.titulo).includes(terminoNormalizado) ||
        this.normalizarTexto(tarea.descripcion).includes(terminoNormalizado) ||
        this.normalizarTexto(tarea.nombreEmpleadoAsignado).includes(terminoNormalizado);

      return matchEmpleado && matchEstado && matchBusqueda;
    });
  });


  paginaActual = signal(1);
  tareasPorPagina = signal(6);

  totalPaginas = computed(() => {
    return Math.ceil(this.tareasFiltradas().length / this.tareasPorPagina());
  });

  paginasDisponibles: Signal<number[]> = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  tareasPaginadas: Signal<Tarea[]> = computed(() => {
    const filtradas = this.tareasFiltradas(); 
    const pagina = this.paginaActual();
    const porPagina = this.tareasPorPagina();

    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;

    return filtradas.slice(inicio, fin);
  });


  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosIniciales(): void {
    this.isLoading.set(true);

    // this.taskService.getEmpleados()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(emps => {
    //     this.empleados.set(emps);

    //     this.cdr.detectChanges();
    //     if (window.HSStaticMethods) {
    //       window.HSStaticMethods.autoInit();
    //     }
    //   });

    // this.taskService.getAllTareas()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(tasks => {
    //     this.allTasks.set(tasks);
    //     this.isLoading.set(false);
    //   });
  }

  onFiltroEmpleadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEmpleado.set(target.value);
    this.paginaActual.set(1);
  }

  onFiltroEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value as EstadoTarea | 'todos');
    this.paginaActual.set(1);
  }

  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.paginaActual.set(1); 
  }
  
  irAPagina(numeroPagina: number): void {
    if (numeroPagina >= 1 && numeroPagina <= this.totalPaginas()) {
      this.paginaActual.set(numeroPagina);
    }
  }
  confirmarEliminacion(tarea: Tarea): void {
    if (!tarea.id) return;

    Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar la tarea "${tarea.titulo}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      // if (result.isConfirmed) {
      //   this.taskService.eliminarTarea(tarea.id!, tarea.titulo)
      //     .then(() => Swal.fire('¡Eliminada!', 'La tarea ha sido eliminada.', 'success'))
      //     .catch(() => Swal.fire('Error', 'No se pudo eliminar la tarea.', 'error'));
      // }
    });
  }

  formatDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
  
}
