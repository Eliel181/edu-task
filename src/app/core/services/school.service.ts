import { FirestoreService } from './firestore.service';
import { inject, Injectable } from '@angular/core';
import { collectionData, Firestore, query, where, DocumentReference, addDoc, doc, docData, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Usuario } from '../interfaces/usuario.model';
import { Observable } from 'rxjs';
import { collection } from 'firebase/firestore';
import { Escuela } from '../interfaces/escuela.model';

@Injectable({
  providedIn: 'root'
})
export class SchoolService {

  private firestore:Firestore = inject(Firestore);
  private firestoreService:FirestoreService = inject(FirestoreService);

  getDirectores():Observable<Usuario[]>{
    const usersRef = collection(this.firestore, 'usuarios');
    const q = query(usersRef, where('rol', '==', 'Director'));

    return collectionData(q,{idField: 'uid'}) as Observable<Usuario[]>;
  }

  crearEscuela(escuela:Partial<Escuela>):Promise<DocumentReference>{
    //creo la referencia a la base de datos
    const escuelasCollection = collection(this.firestore, 'escuelas');
    //addDoc recibe la referencia y los datos a almacenar en la base de datos
    return addDoc(escuelasCollection, escuela);
  }

  getAllEscuelas():Observable<Escuela[]>{
    const escuelaCollection = collection(this.firestore, 'escuelas');
    return collectionData(escuelaCollection, {idField: 'id'}) as Observable<Escuela[]>;
  }

  getEscuelaById(id:string):Observable<Escuela | undefined>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return docData(escuelaDocRef,{idField:'id'}) as Observable<Escuela | undefined>;
  }

  updateEscuela(id:string, escuela:Partial<Escuela>):Promise<void>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return updateDoc(escuelaDocRef, escuela);
  }

  eliminarEscuela(id:string):Promise<void>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return deleteDoc(escuelaDocRef);
  }

  async cueExists(id:string, excludeId?:string){
    return this.firestoreService.checkIfFieldExists('escuelas', 'cue', id, excludeId)
  }
}
