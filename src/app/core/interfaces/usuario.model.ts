export type RolUsuario = 'Empleado' | 'Alumno' | 'RTE' | 'Admin' | 'Director';

export interface Usuario {
  uid: string;
  email: string;
  telefono: string;
  apellido: string;
  nombre: string;
  rol: RolUsuario;
  perfil?: string;  
  emailVerified?: boolean;

  online?: boolean;
  lastSeen?: any; 
}
