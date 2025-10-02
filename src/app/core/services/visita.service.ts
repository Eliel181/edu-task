import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, DocumentReference, Firestore, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { Escuela } from '../interfaces/escuela.model';
import { Observable } from 'rxjs';
import { Visita } from '../interfaces/visita.model';

@Injectable({
  providedIn: 'root'
})
export class VisitaService {

  private firestore:Firestore = inject(Firestore);
  private firestoreService:FirestoreService = inject(FirestoreService);

  getAllEscuelas():Observable<Escuela[]>{
    const escuelaCollection = collection(this.firestore, 'escuelas');
    return collectionData(escuelaCollection, {idField: 'id'}) as Observable<Escuela[]>;
  }

  getAllVisitas():Observable<Visita[]>{
    const visitaCollection = collection(this.firestore, 'visitas');
    return collectionData(visitaCollection, {idField: 'id'}) as Observable<Visita[]>;
  }

  getVisitasByRte(rteUid:string):Observable<Visita[]>{
    const visitas = this.firestoreService.getCollectionByFilter('visitas', 'creadaPor', rteUid);
    return visitas as Observable<Visita[]>;
  }

  getVisitasByRangeAndRte(rteUid:string, fechaInicio:string, fechaFin:string):Observable<Visita[]>{
    const visitaCollection = collection(this.firestore, 'visitas');

    const q = query(visitaCollection, where('creadaPor', '==', rteUid), where('fecha', '>=', fechaInicio), where('fecha', '<=', fechaFin));
    return collectionData(q, { idField: 'id' }) as Observable<Visita[]>;
  }

  crearVisita(visita:Partial<Visita>):Promise<DocumentReference>{
    const visitasCollection = collection(this.firestore, 'visitas');
    return addDoc(visitasCollection, visita);
  }

  getVisitaById(id:string):Observable<Visita | undefined>{
    const visitaDocRef = doc(this.firestore, `visitas/${id}`);
    return docData(visitaDocRef,{idField:'id'}) as Observable<Visita | undefined>;
  }

  updateVisita(id:string, visita:Partial<Visita>):Promise<void>{
    const evisitaDocRef = doc(this.firestore, `visitas/${id}`);
    return updateDoc(evisitaDocRef, visita);
  }

  eliminarVisita(id:string):Promise<void>{
    const visitaDocRef = doc(this.firestore, `visitas/${id}`);
    return deleteDoc(visitaDocRef);
  }
}
