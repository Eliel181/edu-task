import { inject, Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, doc, docData, DocumentReference, Firestore, getDoc, updateDoc, collectionData } from '@angular/fire/firestore';
import { Eleccion, Candidato, Voto } from '../interfaces/eleccion.model';
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

  getEleccionById(id: string): Observable<Eleccion> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${id}`);
    return docData(eleccionDocRef, { idField: 'id' }) as Observable<Eleccion>;
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

async guardarVotos(eleccionId: string, votos: Voto[]): Promise<void> {
  const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
  const snap = await getDoc(eleccionDocRef);

  if (snap.exists()) {
    const eleccion = snap.data() as Eleccion;
    
    const candidatosActualizados = eleccion.candidatos.map(candidato => {
      // Encontrar el voto para este candidato
      const votoParaEsteCandidato = votos.find(v => {
        // Aquí necesitamos una forma de relacionar el voto con el candidato
        // Asumiendo que el voto tiene una propiedad candidatoId
        return (v as any).candidatoId === candidato.id;
      });

      if (votoParaEsteCandidato) {
        // Remover voto existente del mismo usuario si existe
        const votosFiltrados = candidato.votos?.filter(v => 
          v.usuarioId !== votoParaEsteCandidato.usuarioId
        ) || [];
        
        // Agregar el nuevo voto
        const votosActualizados = [...votosFiltrados, votoParaEsteCandidato];
        
        // Calcular nuevas estadísticas
        const puntuacionTotal = votosActualizados.reduce((sum, v) => sum + v.total, 0);
        const promedioGeneral = votosActualizados.length > 0 
          ? votosActualizados.reduce((sum, v) => sum + v.promedio, 0) / votosActualizados.length
          : 0;

        return {
          ...candidato,
          votos: votosActualizados,
          puntuacionTotal,
          promedioGeneral: Number(promedioGeneral.toFixed(2))
        };
      }
      
      return candidato;
    });

    await updateDoc(eleccionDocRef, { candidatos: candidatosActualizados });
  }
}
 

  // NUEVO MÉTODO: Agregar voto a un candidato específico
  async agregarVotoACandidato(eleccionId: string, candidatoId: string, nuevoVoto: Voto): Promise<void> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
    const snap = await getDoc(eleccionDocRef);

    if (snap.exists()) {
      const eleccion = snap.data() as Eleccion;
      
      // Actualizar el array de candidatos
      const candidatosActualizados = eleccion.candidatos.map(candidato => {
        if (candidato.id === candidatoId) {
          // Filtrar votos existentes del mismo usuario
          const votosFiltrados = candidato.votos?.filter(v => v.usuarioId !== nuevoVoto.usuarioId) || [];
          
          // Agregar el nuevo voto
          const votosActualizados = [...votosFiltrados, nuevoVoto];
          
          // Calcular nuevas estadísticas
          const puntuacionTotal = votosActualizados.reduce((sum, v) => sum + v.total, 0);
          const promedioGeneral = votosActualizados.length > 0 
            ? votosActualizados.reduce((sum, v) => sum + v.promedio, 0) / votosActualizados.length
            : 0;

          return {
            ...candidato,
            votos: votosActualizados,
            puntuacionTotal,
            promedioGeneral: Number(promedioGeneral.toFixed(2))
          };
        }
        return candidato;
      });

      await updateDoc(eleccionDocRef, { candidatos: candidatosActualizados });
    }
  }

  async iniciarVotacion(eleccionId: string): Promise<void> {
    const eleccionDocRef = doc(this.firestore, `elecciones/${eleccionId}`);
    await updateDoc(eleccionDocRef, {
      estado: 'Iniciada'
    });
  }
}
