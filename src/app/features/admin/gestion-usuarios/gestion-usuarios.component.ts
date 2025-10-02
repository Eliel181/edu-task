import { FirestoreService } from './../../../core/services/firestore.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { Usuario } from '../../../core/interfaces/usuario.model';
import Swal from 'sweetalert2';
import { RouterLink, RouterModule } from '@angular/router';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, RouterLink],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css'
})
export class GestionUsuariosComponent implements OnInit {

  private firestoreService = inject(FirestoreService);
  private activityFeedService: ActivityFeedService = inject(ActivityFeedService);
  private authService: AuthService = inject(AuthService);

  // Datos y estado
  usuariosOriginales: WritableSignal<Usuario[]> = signal([]);
  isLoading = signal(true);

  // Búsqueda y paginación
  terminoBusqueda = signal('');
  paginaActual = signal(1);
  usuariosPorPagina = signal(3); // cambialo si querés más por página

  // Normalizar texto (para búsquedas)
  private normalizarTexto(texto?: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Filtrado por término de búsqueda
  filteredUsers: Signal<Usuario[]> = computed(() => {
    const todos = this.usuariosOriginales();
    const termino = this.normalizarTexto(this.terminoBusqueda());

    if (!termino) return todos;

    return todos.filter(u => {
      const nombreCompleto = `${u.nombre} ${u.apellido}`;
      return this.normalizarTexto(nombreCompleto).includes(termino) ||
        this.normalizarTexto(u.email).includes(termino) ||
        this.normalizarTexto(u.rol).includes(termino) ||
        this.normalizarTexto(u.telefono || '').includes(termino);
    });
  });

  // Total de páginas (reactivo)
  totalPaginas = computed(() => {
    const total = this.filteredUsers().length;
    return Math.max(1, Math.ceil(total / this.usuariosPorPagina()));
  });

  // Array simple de páginas (1..N). NO hay lógica de "..." — lista completa.
  paginasDisponibles = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  // Usuarios para la página actual
  usuariosPaginados: Signal<Usuario[]> = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.usuariosPorPagina();
    const fin = inicio + this.usuariosPorPagina();
    return this.filteredUsers().slice(inicio, fin);
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.isLoading.set(true);
    this.firestoreService.getCollection<Usuario>('usuarios').subscribe(
      data => {
        this.usuariosOriginales.set(data || []);
        this.isLoading.set(false);
        this.paginaActual.set(1);
      },
      err => {
        console.error('Error cargando usuarios', err);
        this.isLoading.set(false);
        Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
      }
    );
  }

  // Eventos
  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.paginaActual.set(1); // volver a la primera página al buscar
  }

  irAPagina(numero: number): void {
    if (numero >= 1 && numero <= this.totalPaginas()) {
      this.paginaActual.set(numero);
    }
  }

  async eliminarUsuario(usuario: Usuario): Promise<void> {
    const admin = this.authService.currentUser();
    if (!admin) {
      return;
    }
    const result = await Swal.fire({
      title: '¿Estás Seguro?',
      text: `Esta acción eliminará al usuario ${usuario.nombre} ${usuario.apellido} del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    try {
      await this.firestoreService.deleteDocument('usuarios', usuario.uid);

      // Registrar actividad de eliminación
      await this.registrarActividadEliminacionUsuario(admin, usuario);

      // Actualizar lista local
      this.usuariosOriginales.set(this.usuariosOriginales().filter(u => u.uid !== usuario.uid));

      // Ajustar página si quedó fuera de rango
      if (this.paginaActual() > this.totalPaginas() && this.totalPaginas() > 0) {
        this.paginaActual.set(this.totalPaginas());
      }

      Swal.fire({
        title: 'Eliminado',
        text: 'Usuario eliminado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error eliminando usuario', error);
      Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
    }
  }
  private async registrarActividadEliminacionUsuario(admin: Usuario, usuarioEliminado: Usuario): Promise<void> {
    await this.activityFeedService.logActivity({
      actorId: admin.uid,
      actorName: `${admin.nombre} ${admin.apellido}`,
      actorImage: admin.perfil,
      action: 'user_deleted', // O puedes crear 'user_deleted'
      entityType: 'user',
      entityId: usuarioEliminado.uid,
      entityDescription: `${usuarioEliminado.nombre} ${usuarioEliminado.apellido}`,
      details: `${admin.nombre} ${admin.apellido} eliminó al usuario "${usuarioEliminado.nombre} ${usuarioEliminado.apellido}" (${usuarioEliminado.email}) del sistema`
    });
  }
}
