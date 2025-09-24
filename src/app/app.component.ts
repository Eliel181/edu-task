import { Component, inject, OnInit, Signal } from '@angular/core';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SpinnerOverlayComponent } from "./shared/spinner-overlay/spinner-overlay.component";
import { Usuario } from './core/interfaces/usuario.model';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);
  
  isAuthLoading: Signal<boolean> = this.authService.isAuthStatusLoaded;

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => window.HSStaticMethods.autoInit(), 100);
      }
    });
  }
}
