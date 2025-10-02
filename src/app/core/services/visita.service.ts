import { inject, Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, collectionData, deleteDoc, doc, docData, DocumentReference, Firestore, getDoc, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { Escuela } from '../interfaces/escuela.model';
import { Observable } from 'rxjs';
import { TareaVisita, Visita } from '../interfaces/visita.model';

@Injectable({
  providedIn: 'root'
})
export class VisitaService {

  private firestore: Firestore = inject(Firestore);
  private firestoreService: FirestoreService = inject(FirestoreService);

  getAllEscuelas(): Observable<Escuela[]> {
    const escuelaCollection = collection(this.firestore, 'escuelas');
    return collectionData(escuelaCollection, { idField: 'id' }) as Observable<Escuela[]>;
  }

  getAllVisitas(): Observable<Visita[]> {
    const visitaCollection = collection(this.firestore, 'visitas');
    return collectionData(visitaCollection, { idField: 'id' }) as Observable<Visita[]>;
  }

  getVisitasByRte(rteUid: string): Observable<Visita[]> {
    const visitas = this.firestoreService.getCollectionByFilter('visitas', 'creadaPor', rteUid);
    return visitas as Observable<Visita[]>;
  }

  getVisitasByRangeAndRte(rteUid: string, fechaInicio: string, fechaFin: string): Observable<Visita[]> {
    const visitaCollection = collection(this.firestore, 'visitas');

    const q = query(visitaCollection, where('creadaPor', '==', rteUid), where('fecha', '>=', fechaInicio), where('fecha', '<=', fechaFin));
    return collectionData(q, { idField: 'id' }) as Observable<Visita[]>;
  }

  crearVisita(visita: Partial<Visita>): Promise<DocumentReference> {
    const visitasCollection = collection(this.firestore, 'visitas');
    return addDoc(visitasCollection, visita);
  }

  getVisitaById(id: string): Observable<Visita | undefined> {
    const visitaDocRef = doc(this.firestore, `visitas/${id}`);
    return docData(visitaDocRef, { idField: 'id' }) as Observable<Visita | undefined>;
  }

  updateVisita(id: string, visita: Partial<Visita>): Promise<void> {
    const evisitaDocRef = doc(this.firestore, `visitas/${id}`);
    return updateDoc(evisitaDocRef, visita);
  }

  eliminarVisita(id: string): Promise<void> {
    const visitaDocRef = doc(this.firestore, `visitas/${id}`);
    return deleteDoc(visitaDocRef);
  }

  async agregarTarea(visitaId: string, tarea: TareaVisita): Promise<void> {
    const ref = doc(this.firestore, `visitas/${visitaId}`);

    const snap = await getDoc(ref);

    if (snap.exists()) {
      //validamos que el documento exista
      updateDoc(ref, {
        tareas: arrayUnion(tarea)
      });
    }
  }

  async editarTarea(visitaId: string, tareaEditada: TareaVisita): Promise<void> {
    const tareaDocRef = doc(this.firestore, `visitas/${visitaId}`);

    // Obtenemos el documento
    const snap = await getDoc(tareaDocRef);

    if (snap.exists()) {
      const data = snap.data() as Visita;

      // Tomamos las tareas actuales (o vacío si no existe el campo)
      const tareasActuales = data.tareas || [];

      // Reemplazamos la tarea cuyo id coincida con la tareaEditada
      const tareasActualizadas = tareasActuales.map((tarea: TareaVisita) =>
        tarea.id === tareaEditada.id ? tareaEditada : tarea
      );

      // Actualizamos en Firestore
      await updateDoc(tareaDocRef, { tareas: tareasActualizadas });
    }
  }

  async eliminarTarea(visitaId: string, tareaId: string): Promise<void> {
    const tareaDocRef = doc(this.firestore, `visitas/${visitaId}`);

    // Obtenemos el documento desde Firestore
    const snap = await getDoc(tareaDocRef);

    // Verificamos si el documento realmente existe en la base de datos
    if (snap.exists()) {
      const data = snap.data() as Visita;
      console.log(data);

      // Obtenemos el array actual de tareas, o un array vacío si no existe
      const tareasActuales = data.tareas || [];

      // Usamos .filter() para eliminar la tarea cuyo ID coincide con el que queremos borrar
      // Esto devuelve un nuevo array con todos los comentarios, menos el que tiene el ID que queremos eliminar
      const tareasFiltradas = tareasActuales.filter(
        (tarea) => tarea.id !== tareaId
      );

      // Sobrescribimos el campo "tareas" del documento con el nuevo array filtrado
      await updateDoc(tareaDocRef, { tareas: tareasFiltradas });
    }
  }
}
