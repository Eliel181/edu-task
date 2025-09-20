import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../tasks/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { EstadoTarea, Tarea } from '../../../core/interfaces/tarea.model';

@Component({
  selector: 'app-mis-tareas',
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.css'
})
export class MisTareasComponent implements OnInit { 
  private tareaService: TaskService = inject(TaskService);
  private authService: AuthService = inject(AuthService);

  tareas = signal<Tarea[]>([]);
  currentUser = signal(this.authService.currentUser());

  private allTasks = signal<Tarea[]>([]);
  
  public filtroEstado = signal<EstadoTarea | 'todos'>('todos');

    private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

    public tareasFiltradas: Signal<Tarea[]> = computed(() => {
    const tasks = this.allTasks();
    const status = this.filtroEstado();
    return tasks.filter(tarea => {

      const matchEstado = (status === 'todos' || tarea.estado === status);

    

      return matchEstado;
    });
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.tareaService.getTareaByEmpleado(user.uid)
      .subscribe(tareas => {
        this.tareas.set(tareas);      // ← lo sigues usando si quieres todas
        this.allTasks.set(tareas); 
      })
    }
  }

}

