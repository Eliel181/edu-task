import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, docData, DocumentReference, Firestore, query, updateDoc, where, Timestamp, deleteDoc } from '@angular/fire/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { Usuario } from '../../core/interfaces/usuario.model';
import { EstadoTarea, Tarea } from '../../core/interfaces/tarea.model';
import { addDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private authService: AuthService = inject(AuthService);

  private readonly collectionPath = 'tareas';

  getEmpleados(): Observable<Usuario[]> {
    const usersRef = collection(this.firestore, 'usuarios');
    const q = query(usersRef, where('rol', '==', 'Empleado'));
    return collectionData(q, { idField: 'uid' }) as Observable<Usuario[]>;
  }


  async crearTarea(tarea: Partial<Tarea>): Promise<DocumentReference> {
    const actor = this.authService.currentUser();
    if (!actor) throw new Error("Usuario no autenticado para crear la tarea.");

    const tareaCompleta = { ...tarea, asignadoPor: actor.uid };

    const tareaRef = await addDoc(collection(this.firestore, this.collectionPath), tareaCompleta);

    return tareaRef;
  }

  getAllTareas(): Observable<Tarea[]> {
    const tareasCollection = collection(this.firestore, 'tareas');
    return collectionData(tareasCollection, { idField: 'id' }) as Observable<Tarea[]>;
  }
  getTareasPendientes(): Observable<Tarea[]> {
    return this.firestoreService.getCollectionByFilter<Tarea>('tareas', 'estado', 'Pendiente');
  }
  getTareaByEmpleado(uid: string): Observable<Tarea[]> {
    const tareasCollection = collection(this.firestore, 'tareas');
    // Tambien filtrar por nombre
    const q = query(tareasCollection, where('asignadoA', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
  }


  // Método para obtener tareas por empleado y estado (para la lista de Mis Tareas)
  getTareasByEmpleadoAndEstado(uid: string, estado: EstadoTarea | 'Todas'): Observable<Tarea[]> {
    const tareasCollection = collection(this.firestore, 'tareas');
    let q;
    if (estado === 'Todas') {
      q = query(tareasCollection, where('asignadoA', '==', uid));
    } else {
      q = query(tareasCollection,
                where('asignadoA', '==', uid),
                where('estado', '==', estado)); // Usa el estado pasado directamente
    }
    return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
  }


  getTareaById(id: string): Observable<Tarea | undefined> {
    const tareaDocRef = doc(this.firestore, `tareas/${id}`);

    return docData(tareaDocRef, { idField: 'id' }) as Observable<Tarea | undefined>;
  }

  updateTarea(id: string, update: { estado?: EstadoTarea, progreso?: number }): Promise<void> {
    const tareaDocRef = doc(this.firestore, `tareas/${id}`);

    const dataToUpdate: any = {
      ...update,
      fechaDeActualizacion: Timestamp.now()
    };
    return updateDoc(tareaDocRef, dataToUpdate);
  }

  async actualizarTareaCompleta(id: string, data: Partial<Tarea>): Promise<void> {
    const actor = this.authService.currentUser();
    if (!actor) throw new Error("Usuario no autenticado para actualizar la tarea.");

    const tareaDocRef = doc(this.firestore, `${this.collectionPath}/${id}`);
    const dataConTimestamp = { ...data, fechaDeActualizacion: Timestamp.now() };

    await updateDoc(tareaDocRef, dataConTimestamp);
  }

  async eliminarTarea(id: string, titulo: string): Promise<void> {
    const actor = this.authService.currentUser();
    if (!actor) {
      throw new Error("Usuario no autenticado para eliminar la tarea.");
    }

    const tareaDocRef = doc(this.firestore, `${this.collectionPath}/${id}`);
    await deleteDoc(tareaDocRef);

  }
  async updateTaskAndLogActivity(
    tareaId: string,
    estadoAnterior: EstadoTarea,
    datosNuevos: { titulo: string; estado: EstadoTarea; progreso: number }
  ): Promise<void> {
    const actor = this.authService.currentUser();
    if (!actor) throw new Error("Empleado no autenticado.");

    await this.updateTarea(tareaId, { estado: datosNuevos.estado, progreso: datosNuevos.progreso });
  }

  getTareasPendientesByEmpleado(uid: string): Observable<Tarea[]> {
    const tareasCollection = collection(this.firestore, 'tareas');
    const q = query(
      tareasCollection,
      where('asignadoA', '==', uid),
      where('estado', '==', 'Pendiente')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
  }

}
