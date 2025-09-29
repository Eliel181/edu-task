import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { SchoolService } from '../../../core/services/school.service';
import { Escuela } from '../../../core/interfaces/escuela.model';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { FirestoreService } from '../../../core/services/firestore.service';

@Component({
  selector: 'app-school-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.css'
})
export class SchoolListComponent implements OnInit {
  private escuelaService: SchoolService = inject(SchoolService);
  private firestoreService: FirestoreService = inject(FirestoreService);

  private escuelasOriginales: WritableSignal<Escuela[]> = signal([]);
  public isLoading = signal(true);

  directorData: Usuario | null = null;

  public terminoBusqueda = signal('');
  public paginaActual = signal(1);
  public escuelasPorPagina = signal(8);

  // Lógica de paginación completa desde el componente de tareas
  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  public escuelasFiltradas: Signal<Escuela[]> = computed(() => {
    const escuelas = this.escuelasOriginales();
    const terminoNormalizado = this.normalizarTexto(this.terminoBusqueda());

    return escuelas.filter(escuela => {
      const matchBusqueda = terminoNormalizado === '' ||
        this.normalizarTexto(escuela.cue).includes(terminoNormalizado) ||
        this.normalizarTexto(escuela.nombreCompleto).includes(terminoNormalizado) ||
        this.normalizarTexto(escuela.email || '').includes(terminoNormalizado);

      return matchBusqueda;
    });
  });

  public totalPaginas = computed(() => {
    return Math.ceil(this.escuelasFiltradas().length / this.escuelasPorPagina());
  });

  public paginasDisponibles: Signal<number[]> = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  public escuelasPaginadas: Signal<Escuela[]> = computed(() => {
    const filtradas = this.escuelasFiltradas();
    const pagina = this.paginaActual();
    const porPagina = this.escuelasPorPagina();

    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;

    return filtradas.slice(inicio, fin);
  });

  ngOnInit(): void {
    this.cargarEscuelas();
  }

  cargarDirector(uidDirector: string): void {

    this.firestoreService.getDocumentById<Usuario>('usuarios', uidDirector).then(
      data => {
        if (data) {
          this.directorData = data;
        }
      }
    );
  }
  cargarEscuelas(): void {
    this.escuelaService.getAllEscuelas().subscribe({
      next: (data) => {
        this.escuelasOriginales.set(data);
        data.map((escuela) => {
          this.cargarDirector(escuela.director);
        })
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las escuelas:', err.message);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar escuelas',
          icon: 'error'
        });
        this.isLoading.set(false);
      }
    });
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

  async eliminarEscuela(id: string): Promise<void> {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el registro del sistema!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await this.escuelaService.eliminarEscuela(id);
        Swal.fire({
          title: '¡Eliminado!',
          text: 'Registro eliminado correctamente',
          icon: 'success'
        });
      } catch (error) {
        console.error('Error al eliminar el registro', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al eliminar el registro',
          icon: 'error',
        });
      }
    }
  }
  // Método para calcular porcentaje para las barras de progreso
  calcularPorcentaje(valor: number, maximo: number): number {
    if (!valor || !maximo) return 0;
    const porcentaje = (valor / maximo) * 100;
    // Limitar a 100% como máximo
    return Math.min(porcentaje, 100);
  }
}
