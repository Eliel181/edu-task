import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../tasks/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Tarea } from '../../../core/interfaces/tarea.model';

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


  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.tareaService.getTareaByEmpleado(user.uid)
      .subscribe(tareas => {
        this.tareas.set(tareas);
      })
    }
  }

}

