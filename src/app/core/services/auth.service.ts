import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { Usuario } from '../interfaces/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private router: Router = inject(Router);

  currentUser: WritableSignal<Usuario | null | undefined> = signal(undefined);

  constructor() { }

  // Metodo para el Registro
  async register({ email, password, telefono, apellido, nombre }: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const { user } = userCredential;
      const newUser: Usuario = {
        uid: user.uid,
        email: user.email!,
        telefono,
        apellido,
        nombre,
        rol: 'Docente',
      };

      await this.firestoreService.setDocument('usuarios', user.uid, newUser);
      this.currentUser.set(newUser);
      this.router.navigate(['/']);

    } catch (error) {
      console.error('Error: en el register() ', error);
      alert('No se pudo completar el registro, es posble que el correo este en uso');
    }
  }
}
