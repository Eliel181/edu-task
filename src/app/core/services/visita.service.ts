import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, DocumentReference, Firestore } from '@angular/fire/firestore';
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

  crearVisita(visita:Partial<Visita>):Promise<DocumentReference>{
    const visitasCollection = collection(this.firestore, 'visitas');
    return addDoc(visitasCollection, visita);
  }
}
