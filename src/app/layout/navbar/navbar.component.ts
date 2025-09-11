import { AfterViewChecked, Component, inject, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.model';

declare const HSStaticMethods: any;

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements AfterViewChecked {
  private authService: AuthService = inject(AuthService);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;

  logOut(): void {
    // Podemos agregar una confirmacion con .then
    this.authService.logOut();
  }

  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }
}
