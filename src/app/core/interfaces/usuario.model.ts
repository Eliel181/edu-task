export type RolUsuario = 'Empleado' | 'Docente' | 'RTE' | 'Admin' | 'Director';

export interface Usuario {
  uid: string;
  email: string;
  telefono: string;
  apellido: string;
  nombre: string;
  rol: RolUsuario;
  perfil?: string;  
  emailVerified?: boolean;
}
