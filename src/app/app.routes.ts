import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verificar-email', loadComponent: () => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent)
  },
  {
    path: 'reset-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  // Rutas para Gestiones de la aplicacion
  {
    path: 'gestion-usuarios', loadComponent: () => import('./features/admin/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent), canActivate: [authGuard, adminGuard]
  },
  {
    path: 'edicion-usuario/:id', loadComponent: () => import('./features/admin/edit-usuario/edit-usuario.component').then(m => m.EditUsuarioComponent), canActivate: [authGuard, adminGuard]
  },

  {
    path: 'gestion-tareas', loadComponent: () => import('./features/tasks/gestion-tareas/gestion-tareas.component').then(m => m.GestionTareasComponent), canActivate: [authGuard]
  },
  {
    path: 'edicion-tarea', loadComponent: () => import('./features/tasks/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent), canActivate: [authGuard]
  },
  {
    path: 'edicion-tarea/:id', loadComponent: () => import('./features/tasks/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent), canActivate: [authGuard]
  },

  {
    path: 'gestion-escuelas', loadComponent: () => import('./features/schools/school-list/school-list.component').then(m => m.SchoolListComponent), canActivate: [authGuard, adminGuard]
  },
  {
    path: 'form-escuela/nuevo', loadComponent: () => import('./features/schools/school-management/school-management.component').then(m => m.SchoolManagementComponent), canActivate: [authGuard, adminGuard]
  },
  {
    path: 'form-escuela/:id', loadComponent: () => import('./features/schools/school-management/school-management.component').then(m => m.SchoolManagementComponent), canActivate: [authGuard, adminGuard]
  },

  {
    path: 'mi-perfil', loadComponent: () => import('./features/auth/perfil/perfil.component').then(m => m.PerfilComponent), canActivate: [authGuard]
  },

  // Ruta para las tareas de un empleado
  {
    //path: 'mis-tareas', loadComponent: () => import('./features/employee/mis-tareas/mis-tareas.component').then(m => m.MisTareasComponent), canActivate: [authGuard]
  },


  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
