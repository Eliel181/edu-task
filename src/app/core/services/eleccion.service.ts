import { inject, Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, doc, docData, DocumentReference, Firestore, getDoc, updateDoc, collectionData } from '@angular/fire/firestore';
import { Eleccion, Candidato } from '../interfaces/eleccion.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EleccionService {

  private firestore: Firestore = inject(Firestore);

  crearEleccion(eleccion: Eleccion): Promise<DocumentReference> {
    const eleccionesCollection = collection(this.firestore, 'elecciones');
    return addDoc(eleccionesCollection, eleccion);
  }

  getElecciones(): Observable<Eleccion[]> {
    const eleccionCollection = collection(this.firestore, 'elecciones');
    return collectionData(eleccionCollection, { idField: 'id' }) as Observable<Eleccion[]>;
  }

  async agregarCandidato(eleccionId: string, candidato: Candidato): Promise<void> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
    await updateDoc(eleccionDocRef, {
      candidatos: arrayUnion(candidato)
    });
  }


  async editarCandidato(eleccionId: string, candidatoEditado: Candidato): Promise<void> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
    const snap = await getDoc(eleccionDocRef);

    if (snap.exists()) {
      const eleccion = snap.data() as Eleccion;
      const candidatosActuales = eleccion.candidatos || [];
      const candidatosActualizados = candidatosActuales.map(c =>
        c.id === candidatoEditado.id ? candidatoEditado : c
      );
      await updateDoc(eleccionDocRef, { candidatos: candidatosActualizados });
    }
  }

  async eliminarCandidato(eleccionId: string, candidatoId: string): Promise<void> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
    const snap = await getDoc(eleccionDocRef);

    if (snap.exists()) {
      const eleccion = snap.data() as Eleccion;
      const candidatosActuales = eleccion.candidatos || [];
      const candidatosFiltrados = candidatosActuales.filter(c => c.id !== candidatoId);
      await updateDoc(eleccionDocRef, { candidatos: candidatosFiltrados });
    }
  }

}
