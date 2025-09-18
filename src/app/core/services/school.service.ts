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

  getDirectores():Observable<Usuario[]>{
    const usersRef = collection(this.firestore, 'usuarios');
    const q = query(usersRef, where('rol', '==', 'Director'));

    return collectionData(q,{idField: 'uid'}) as Observable<Usuario[]>;
  }

  crearTarea(escuela:Partial<Escuela>):Promise<DocumentReference>{
    //creo la referencia a la base de datos
    const escuelasCollection = collection(this.firestore, 'escuelas');
    //addDoc recibe la referencia y los datos a almacenar en la base de datos
    return addDoc(escuelasCollection, escuela);
  }

  getAllEscuelas():Observable<Escuela[]>{
    const escuelaCollection = collection(this.firestore, 'escuelas');
    return collectionData(escuelaCollection, {idField: 'id'}) as Observable<Escuela[]>;
  }

  getTareaById(id:string):Observable<Escuela | undefined>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return docData(escuelaDocRef,{idField:'id'}) as Observable<Escuela | undefined>;
  }

  updateTarea(id:string, escuela:Partial<Escuela>):Promise<void>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return updateDoc(escuelaDocRef, escuela);
  }

  eliminarEscuela(id:string):Promise<void>{
    const escuelaDocRef = doc(this.firestore, `escuelas/${id}`);
    return deleteDoc(escuelaDocRef);
  }
}
