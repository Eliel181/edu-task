export type NivelEducativo = 'Primario' | 'Secundario' | 'Terciario' | 'Universitario';

export interface Escuela {
  id?:string;
  nombreCompleto:string;
  nombreCorto:string;
  cue:string;
  direccion:string;
  telefono:number;
  email:string;
  paginaWeb:string;
  director:string; //uid de un usuario con el rol de "Director"
  matriculaTotal:string;
  nivel:NivelEducativo;
  cantAlumnos:number;
  cantDocentes:number;
  cantAdministrativos:number;
  cantEmpleados:number;
}
