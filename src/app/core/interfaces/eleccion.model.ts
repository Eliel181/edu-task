export interface Eleccion {
  id?: string;
  titulo: string;                        // Ej: "Elección Miss Primavera 2025"
  descripcion?: string;
  criterios: CriterioEvaluacion[];       // Criterios definidos por el usuario
  candidatos: Candidato[];               // Participantes
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'Iniciada' | 'Finalizada';
  votos?: Voto[];                       // Almacena los votos de los usuarios
}

export interface Candidato {
  id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  hobies: string;
  propuesta: string;
  imagenes: ImagenCandidato[];
}

export interface CriterioEvaluacion {
  id: string;               // Identificador único (por ejemplo UUID)
  nombre: string;           // Ejemplo: "Presentación", "Carisma", "Conocimientos"
  peso?: number;            // Ponderación (opcional, por si cada criterio vale distinto)
}

export interface EvaluacionCandidato {
  criterioId: string;       // Referencia al criterio
  puntaje: number;          // Puntuación obtenida (por ejemplo 0–10)
}

export interface ImagenCandidato {
  public_id: string;
  secure_url: string;
}

// Representa el voto detallado de un usuario por un candidato, incluyendo la puntuación para cada criterio.
export interface Voto {
  usuarioId: string;
  candidatoId: string;
  evaluaciones: EvaluacionCandidato[];
}
