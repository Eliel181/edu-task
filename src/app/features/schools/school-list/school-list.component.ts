import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { SchoolService } from '../../../core/services/school.service';
import { Escuela } from '../../../core/interfaces/escuela.model';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-school-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.css'
})
export class SchoolListComponent {
  private escuelaService: SchoolService = inject(SchoolService);
  private escuelasOriginales: WritableSignal<Escuela[]> = signal([]);
  isLoading = signal(true);

  terminoBusqueda = signal('');
  paginaActual = signal(1);
  escuelasPorPagina = signal(8);

  private normalizarTexto(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    //normalize: convierte un carácter combinado en dos
  }

  escuelasPaginadas: Signal<Escuela[]> = computed(() => {
    const todos = this.escuelasOriginales();
    const terminoNormalizado = this.normalizarTexto(this.terminoBusqueda());

    if (!terminoNormalizado) {
      //si no hay búsqueda retorno todos los libros
      return todos;
    }

    return todos.filter(escuela => {
      return this.normalizarTexto(escuela.cue).includes(terminoNormalizado) ||
            this.normalizarTexto(escuela.nombreCompleto).includes(terminoNormalizado);
    })
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.escuelasPaginadas().length / this.escuelasPorPagina())
  });

  ngOnInit(): void {
    this.escuelaService.getAllEscuelas().subscribe({
      next: (data) => {
        this.escuelasOriginales.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('erro al cargar las escuelas:', err.message);

        Swal.fire({
          title: 'Error',
          text: 'Error al cargar escuelas',
          icon: 'error'
        })

        this.isLoading.set(false);
      }
    });
  }

  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.paginaActual.set(1)
  }

  irAPagina(numeroPagina: number): void {
    if (numeroPagina >= 1 && numeroPagina <= this.totalPaginas()) {
      this.paginaActual.set(numeroPagina);
    }
  }

  async eliminarEscuela(id: string): Promise<void> {
    await Swal.fire({
      title: "¿Estas Seguro?",
      text: "Esta acción eliminara el registro del sistema!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, deseo borrarlo!"
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.escuelaService.eliminarEscuela(id);
          Swal.fire({
            title: '¡Eliminado!',
            text: 'Registro Eliminada Correctamente',
            icon: 'success'
          });
        } catch (error) {
          console.error('Erro al eliminar el registro', error);

          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al Eliminar el Registro',
            icon: 'error',
          });
        }
      }
    });
  }
}
