
import { Timestamp } from '@angular/fire/firestore';

export type ActivityAction =
  | 'register'
  | 'create_school'
  | 'delete_school'
  | 'update_school'
  | 'task_started'
  | 'task_finished'
  | 'task_updated'
  | 'task_deleted'
  | 'task_created'
  | 'user_deleted'    
  | 'role_changed';

export interface ActivityFeed {
  id?: string;
  actorId: string;          // ID del usuario que realizó la acción
  actorName: string;        // Nombre visible
  actorImage?: string;      // Avatar

  action: ActivityAction;   // Tipo de acción
  entityType: string;       // Tipo de entidad afectada (school, user, task, etc)
  entityId?: string;        // ID de la entidad
  entityDescription: string;// Descripción de lo afectado ("Esc. San Martín", "Usuario: Juan Pérez")
  details: string;          // Texto descriptivo ("Actualizó los datos de la escuela")
  timestamp: Timestamp;     // Fecha/hora de la acción
}
