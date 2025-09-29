import { Timestamp } from '@angular/fire/firestore'

export type EstadoVisita = 'Planificada' | 'En Curso' | 'Finalizada';

export interface Visita {
  id?:string;
  escuelaId:string;
  cueEscuela:string;
  nombreEscuela:string;
  direccionEscuela:string;
  fecha: string;
  horaInicio?:string;
  horaFin?:string;
  observaciones?:string;
  tareas:TareaVisita[]; //actividades de la visita
  estado: EstadoVisita;
  creadaPor:string;//UID del RTE creador de la visita
  fechaDeCreacion: Timestamp;//esta fecha sera util para filtrar tareas
}

export interface TareaVisita {
  id?:string;
  nombre:string;
  descripcion:string;
  completada:boolean;
}
