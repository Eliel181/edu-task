import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, onAuthStateChanged, signOut, sendPasswordResetEmail } from '@angular/fire/auth';
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

  constructor() {
    onAuthStateChanged(this.auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const user = await this.firestoreService.getDocument<Usuario>('usuarios', firebaseUser.uid);
          this.currentUser.set(user || null);
        } else {
          this.currentUser.set(null);
        }
      });
  }

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

  // Metodo para enviar un email de confirmacion
  async sendEmailVerification(): Promise<void> {
    const firebaseUser = this.auth.currentUser;

    if (!firebaseUser) {
      throw new Error('No hay usuario autenticado');
    }
    if (firebaseUser.emailVerified) {
      throw new Error('No hay usuario autenticado');
    }
    try {
      await sendEmailVerification(firebaseUser);
      console.log(`Correo de verificación enviado a: ${firebaseUser.email}`);
    } catch (error) {
      console.error('Error al enviar verificación:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  async login({ email, password }: any) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      await user.reload();

      if (!user.emailVerified) {
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      this.router.navigate(['']);
    } catch (error: any) {
      console.error("Error en el login", error);
      throw new Error(error.message || 'Error en el login, revisa tus credenciales.');
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const { user } = userCredential;

      const displayName = user.displayName || "";

      const partes = displayName.trim().split(" ");
      let nombre = "";
      let apellido = "";

      if (partes.length > 1) {
        nombre = partes[0];
        apellido = partes[partes.length - 1]; // último elemento
      } else {
        nombre = displayName; // si solo hay un nombre
      }

      let appUser = await this.firestoreService.getDocumentById<Usuario>('usuarios', user.uid)

      //si me trae información significa que el usuario ya esta logueado
      if (!appUser) {
        console.log(`Usuario con UID:${user.uid} no encontrado, Creando doc nuevo...`);
        const newUser: Usuario = {
          uid: user.uid,
          email: user.email!,
          telefono: '',
          apellido: apellido,
          nombre: nombre,
          rol: 'Empleado',
          perfil: user.photoURL || ''
        };

        await this.firestoreService.setDocument('usuarios', user.uid, newUser);

        this.currentUser.set(newUser);
        this.router.navigate(['/']);

      }
    } catch (error) {
      console.error('Error en login con google', error);
    }
  }

  // Metodo para el LogOut
  async logOut() {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async resetPassword(email: string): Promise<void> {
    // Metodo para enviar email de recuperacion de la contraseña
  try {
    await sendPasswordResetEmail(this.auth, email);
  } catch (error: any) {
    console.error("Error al enviar email de recuperación", error);
    throw new Error(error.message || 'No se pudo enviar el email de recuperación.');
  }
}
}
