import { Timestamp } from "@angular/fire/firestore";

export type EstadoTarea = 'Pendiente' | 'En Proceso' | 'Finalizada';
export type PrioridadTarea = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface Tarea {
    id?: string,
    titulo: string,
    descripcion: string,
    asignadoA: string,
    asignadoPor: string,
    fotoEmpleadoAsignado: string,
    nombreEmpleadoAsignado: string,
    estado: EstadoTarea,
    prioridad: PrioridadTarea,
    progreso: number,
    fechaDeCreacion: Timestamp,
    fechaDeActualizacion: Timestamp,
    fechaDeVencimiento?: Timestamp | null,

    comentarios?: Comentario[];
}

export interface Comentario {
  id?: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  fecha: Timestamp;
}
