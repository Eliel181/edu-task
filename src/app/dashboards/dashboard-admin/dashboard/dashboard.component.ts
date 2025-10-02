import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';
import { ActivityFeed } from '../../../core/interfaces/activity-feed.model';
import { RouterModule } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { Tarea } from '../../../core/interfaces/tarea.model';
import { TaskService } from '../../../features/tasks/task.service';
import { GraficoUsuariosComponent } from "../grafico-usuarios/grafico-usuarios.component";
import { NgApexchartsModule } from 'ng-apexcharts';



@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, GraficoUsuariosComponent, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private activityFeedService: ActivityFeedService = inject(ActivityFeedService);
  usuariosOnline = signal<Usuario[]>([]);
  firestoreService: FirestoreService = inject(FirestoreService);
  authService: AuthService = inject(AuthService);
  private taskService = inject(TaskService);
  totalUsuarios = signal<number>(0);
  totalEscuelas = signal<number>(0);
  activities = signal<ActivityFeed[]>([]);
  tareasProximas = signal<Tarea[]>([]);
cargandoTareas = signal<boolean>(true);


  ngOnInit(): void {
    const currentUser = this.authService.currentUser();

    this.firestoreService.getUsuariosOnline<Usuario>('usuarios').subscribe(users => {

      const filtered = users.filter(u => u.uid !== currentUser?.uid);
      this.usuariosOnline.set(filtered);
    });

    this.cargarTotales();

    this.activityFeedService.getRecentActivities().subscribe({
      next: (acts) => this.activities.set(acts),
      error: (err) => console.error('Error loading activities', err),
    });

this.taskService.getTareasProximasAVencer().subscribe({
  next: (tareas) => {    console.log('Tareas recibidas:', tareas);
    console.log('Número de tareas:', tareas.length);
    this.tareasProximas.set(tareas);
    this.cargandoTareas.set(false);
  },
  error: (err) => {
    console.error('Error cargando tareas:', err);
    this.cargandoTareas.set(false);
  },
  complete: () => {
    console.log('Completada suscripción a tareas');
  }
});

  }

  cargarTotales() {
    this.firestoreService.getCollection<Usuario>('usuarios').subscribe(usuarios => {
      this.totalUsuarios.set(usuarios.length);
    });

    this.firestoreService.getCollection<any>('escuelas').subscribe(escuelas => {
      this.totalEscuelas.set(escuelas.length);
    });
  }
  getLastSeenText(lastSeen: any): string {
    if (!lastSeen) return 'Sin datos';
    const last = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const diffMs = Date.now() - last.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'ahora mismo';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    return `hace ${diffHr} h`;
  }

  formatRelativeTime(timestamp: Timestamp): string {
    const now = new Date();
    const past = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) {
      return 'Hace unos segundos';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };
    return past.toLocaleString('es-ES', options);
  }

  formatShortDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  private toDate(timestamp: Timestamp | Date): Date {
    return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  }

isVencida(tarea: Tarea): boolean {
  if (!tarea.fechaDeVencimiento) return false;
  
  const fechaVenc = this.toDate(tarea.fechaDeVencimiento);
  // Normalizamos a medianoche para quitar horas
  const venc = new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), fechaVenc.getDate());
  const hoy = new Date();
  const actual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  
  return venc < actual;
}

diasRestantes(tarea: Tarea): number {
  if (!tarea.fechaDeVencimiento) return 0;
  
  const fechaVenc = this.toDate(tarea.fechaDeVencimiento);
  // Normalizamos ambas fechas a medianoche
  const venc = new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), fechaVenc.getDate());
  const hoy = new Date();
  const actual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  
  const diffTime = Math.abs(venc.getTime() - actual.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
}