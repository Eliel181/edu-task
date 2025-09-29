import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { empleadoGuard } from './core/guards/empleado.guard';
import { PrivateLayoutComponent } from './layout/private-layout/private-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Layout público
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [publicGuard] },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [publicGuard] },
      { path: 'verificar-email', loadComponent: () => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
    ]
  },

  // Layout privado
  {
    path: 'administracion',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
    {
      path: '',
      pathMatch: 'full',
      // usar un guard que espere currentUser
      loadComponent: () => import('./dashboards/dashboard-admin/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
    },
      // { path: 'dashboard', loadComponent: () => import('./dashboards/dashboard-admin/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [adminGuard] },

      { path: 'gestion-usuarios', loadComponent: () => import('./features/admin/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent), canActivate: [adminGuard] },
      { path: 'gestion-usuarios/edicion-usuario/:id', loadComponent: () => import('./features/admin/edit-usuario/edit-usuario.component').then(m => m.EditUsuarioComponent), canActivate: [adminGuard] },

      { path: 'gestion-tareas', loadComponent: () => import('./features/tasks/gestion-tareas/gestion-tareas.component').then(m => m.GestionTareasComponent) },
      { path: 'gestion-tareas/form-tarea', loadComponent: () => import('./features/tasks/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent) },
      { path: 'gestion-tareas/form-tarea/:id', loadComponent: () => import('./features/tasks/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent) },

      { path: 'gestion-escuelas', loadComponent: () => import('./features/schools/school-list/school-list.component').then(m => m.SchoolListComponent), canActivate: [adminGuard] },
      { path: 'gestion-escuelas/form-escuela/nuevo', loadComponent: () => import('./features/schools/school-management/school-management.component').then(m => m.SchoolManagementComponent), canActivate: [adminGuard] },
      { path: 'gestion-escuelas/form-escuela/:id', loadComponent: () => import('./features/schools/school-management/school-management.component').then(m => m.SchoolManagementComponent), canActivate: [adminGuard] },

      { path: 'mi-perfil', loadComponent: () => import('./features/auth/perfil/perfil.component').then(m => m.PerfilComponent) },

      { path: 'mis-tareas', loadComponent: () => import('./features/employee/mis-tareas/mis-tareas.component').then(m => m.MisTareasComponent), canActivate: [empleadoGuard] },
      { path: 'mis-tareas/:id', loadComponent: () => import('./features/employee/detalle-tarea/detalle-tarea.component').then(m => m.DetalleTareaComponent), canActivate: [empleadoGuard] },

      { path: 'calendario', loadComponent: () => import('./features/referents/calendario/calendario.component').then(m => m.CalendarioComponent), canActivate: [authGuard] },
    ]
  },

  // Redirecciones
  { path: '**', redirectTo: 'login' }
];
