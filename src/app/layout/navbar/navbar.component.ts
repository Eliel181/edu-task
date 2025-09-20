import { AfterViewChecked, Component, computed, inject, signal, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.model';
import { TaskService } from '../../features/tasks/task.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Tarea } from '../../core/interfaces/tarea.model';
import { of, switchMap } from 'rxjs';

declare const HSStaticMethods: any;

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements AfterViewChecked {
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
