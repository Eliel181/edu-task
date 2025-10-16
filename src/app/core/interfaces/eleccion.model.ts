export interface Eleccion {
  id?: string;
  titulo: string;                        // Ej: "Elección Miss Primavera 2025"
  descripcion?: string;
  tipo: string;                          // Ej: "belleza", "rendimiento", "popularidad"
  criterios: CriterioEvaluacion[];       // Criterios definidos por el usuario
  candidatos: Candidato[];               // Participantes
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'Iniciada' | 'Finalizada';
}

export interface Candidato {
  id?: string;
  nombre: string;
  partido?: string;
  cargo?: string;
  imagenes: ImagenCandidato[];
  evaluaciones?: EvaluacionCandidato[];  // Puntuaciones por criterio
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
