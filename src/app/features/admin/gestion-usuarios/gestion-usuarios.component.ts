import { FirestoreService } from './../../../core/services/firestore.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css'
})
export class GestionUsuariosComponent implements OnInit{
  private firestoreService: FirestoreService = inject(FirestoreService);
  private usuariosOriginales: WritableSignal<Usuario[]> = signal([]);
  isLoading = signal(true)

  terminoBusqueda = signal('');
  paginaActual = signal(1);
  usuariosPorPagina = signal(8);

  private normalizarTexto(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    //normalize: convierte un carácter combinado en dos
  }

  usuariosPaginados: Signal<Usuario[]> = computed(() => {
    const todos = this.usuariosOriginales();
    const terminoNormalizado = this.normalizarTexto(this.terminoBusqueda());

    if (!terminoNormalizado) {
      //si no hay búsqueda retorno todos los libros
      return todos;
    }

    return todos.filter(usuario => {
      return this.normalizarTexto(usuario.nombre).includes(terminoNormalizado) ||
        this.normalizarTexto(usuario.apellido).includes(terminoNormalizado) ||
        this.normalizarTexto(usuario.rol).includes(terminoNormalizado);
    })
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.usuariosPaginados().length / this.usuariosPorPagina())
  });

  ngOnInit(): void {
    this.firestoreService.getCollection<Usuario>('usuarios').subscribe(
      data => {
        this.usuariosOriginales.set(data);
        this.isLoading.set(false);
      }
    )
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

  async eliminarUsuario(uid: string): Promise<void> {
    await Swal.fire({
      title: "¿Estas Seguro?",
      text: "Esta solo eliminara el registro no la Autenticación!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, deseo borrarlo!"
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          this.firestoreService.deleteDocument('usuarios', uid);
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
