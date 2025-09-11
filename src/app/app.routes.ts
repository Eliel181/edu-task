import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path:'login', loadComponent:()=>import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path:'register', loadComponent:() => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path:'verificar-email', loadComponent:() => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent)
  },
  {
    path:'gestion-usuarios', loadComponent:() => import('./features/admin/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent)
  },
];
