import { AfterViewChecked, Component, computed, inject, Signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../features/tasks/task.service';
import { Usuario } from '../../core/interfaces/usuario.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { Tarea } from '../../core/interfaces/tarea.model';
import { RouterModule, RouterOutlet } from '@angular/router';

declare const HSStaticMethods: any;

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent implements AfterViewChecked {
  private authService: AuthService = inject(AuthService);
  private taskService: TaskService = inject(TaskService);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;

  private currentUserObservable = toObservable(this.currentUser);

  private tareasPendientesObservable = this.currentUserObservable.pipe(
    switchMap(user => {
      if (user?.uid) {
        return this.taskService.getTareasPendientesByEmpleado(user.uid);
      }
      return of([]); 
    })
  );

  tareasPendientes: Signal<Tarea[]> = toSignal(this.tareasPendientesObservable, { initialValue: [] });

  totalTareasPendientes: Signal<number> = computed(() => this.tareasPendientes().length);
 
  logOut(): void {
    // Podemos agregar una confirmacion con .then
    this.authService.logOut();
  }

  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }
}