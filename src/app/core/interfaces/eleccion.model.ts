export interface ImagenCandidato {
  public_id: string;
  secure_url: string;
}

export interface Eleccion {
  id?: string;
  titulo: string;                        // Ej: "Elección Miss Primavera 2025"
  descripcion?: string;       // Criterios definidos por el usuario
  candidatos: Candidato[];               // Participantes
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'Iniciada' | 'Finalizada';
}

export interface Candidato {
  id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  hobies: string;
  propuesta: string;
  imagenes: ImagenCandidato[];
  votos?: Voto[];
  puntuacionTotal?: number; // Suma de todos los votos (total general)
  promedioGeneral?: number; // Promedio total (suma promedios / cantidad de votos)
}

export interface Voto {
  usuarioId: string;    // UID del votante
  belleza: number;      // Puntuación 0–10
  carisma: number;      // Puntuación 0–10
  elegancia: number;    // Puntuación 0–10
  total: number;        // Suma de los tres criterios
  promedio: number;     // Promedio de los tres criterios
  fecha: Date;          // Fecha del voto
}
