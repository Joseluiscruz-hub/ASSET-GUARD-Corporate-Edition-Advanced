// =======================================================================================
// auth.service.ts — AssetGuard Corporate Edition Advanced
// Fusión definitiva de los 3 repositorios:
//   - Signals reactivos + NgZone de 'Corporate-Edition' (mejor manejo de estado)
//   - Roles y sincronización de perfil de 'Edithion' (UserProfile en Firestore)
//   - Modo Demo con autenticación anónima + fallback offline
// =======================================================================================

import { Injectable, signal, computed, NgZone } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../firebase-init';
import { db } from '../firebase-init'; // Firestore instance
import { UserProfile } from '../types';

// AuthUser compatible con ambos repos
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = firebaseApp;
  private auth = getAuth(this.app);

  // Signals reactivos (de Corporate-Edition)
  readonly currentUser = signal<AuthUser | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAuthReady = signal(false);

  constructor(private ngZone: NgZone) {
    onAuthStateChanged(this.auth, async (user) => {
      this.ngZone.run(async () => {
        if (user) {
          this.currentUser.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          // Sincronizar perfil de Firestore (de Edithion)
          await this.syncUserProfile(user);
        } else {
          this.currentUser.set(null);
          this.userProfile.set(null);
        }
        this.isLoading.set(false);
        this.isAuthReady.set(true);
      });
    });
  }

  // --- LOGIN EMAIL/PASSWORD ---
  async login(email: string, password: string): Promise<boolean> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.ngZone.run(async () => {
        this.currentUser.set({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
        await this.syncUserProfile(result.user);
        this.isLoading.set(false);
      });
      return true;
    } catch (err: any) {
      this.ngZone.run(() => {
        this.handleAuthError(err);
        this.isLoading.set(false);
      });
      return false;
    }
  }

  // --- REGISTRO ---
  async register(email: string, password: string, displayName: string): Promise<boolean> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(result.user, { displayName });

      this.ngZone.run(async () => {
        this.currentUser.set({
          uid: result.user.uid,
          email: result.user.email,
          displayName: displayName,
          photoURL: result.user.photoURL
        });
        await this.syncUserProfile(result.user);
        this.isLoading.set(false);
      });
      return true;
    } catch (err: any) {
      this.ngZone.run(() => {
        this.handleAuthError(err);
        this.isLoading.set(false);
      });
      return false;
    }
  }

  // --- LOGIN CON GOOGLE (de Edithion) ---
  async loginWithGoogle(): Promise<boolean> {
    this.error.set(null);
    this.isLoading.set(true);

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.ngZone.run(async () => {
        this.currentUser.set({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
        await this.syncUserProfile(result.user);
        this.isLoading.set(false);
      });
      return true;
    } catch (err: any) {
      this.ngZone.run(() => {
        this.handleAuthError(err);
        this.isLoading.set(false);
      });
      return false;
    }
  }

  // --- MODO DEMO (autenticación anónima + fallback offline) ---
  async loginAsDemo(): Promise<boolean> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const result = await signInAnonymously(this.auth);
      this.currentUser.set({
        uid: result.user.uid,
        email: 'demo@assetguard.com',
        displayName: 'Usuario Demo',
        photoURL: null
      });
      this.isLoading.set(false);
      return true;
    } catch (err: any) {
      console.error('Error en acceso demo:', err);
      // Fallback: usuario local si Firebase falla
      this.currentUser.set({
        uid: 'demo-user-local',
        email: 'demo@assetguard.com',
        displayName: 'Usuario Demo (Offline)',
        photoURL: null
      });
      this.isLoading.set(false);
      return true;
    }
  }

  // --- LOGOUT ---
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.ngZone.run(() => {
        this.currentUser.set(null);
        this.userProfile.set(null);
      });
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  // --- SINCRONIZACIÓN DE PERFIL EN FIRESTORE (de Edithion) ---
  private async syncUserProfile(user: User): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        this.userProfile.set(userDoc.data() as UserProfile);
      } else {
        // Crear perfil por defecto
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: user.email === 'admin@assetguard.com' ? 'admin' : 'viewer'
        };
        await setDoc(userDocRef, profile);
        this.userProfile.set(profile);
      }
    } catch (error) {
      console.error('Error sincronizando perfil de usuario:', error);
      // Si falla Firestore, usar perfil básico del usuario
      this.userProfile.set({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'viewer'
      });
    }
  }

  // --- HELPER PARA CONTROL DE ACCESO POR ROLES (de Edithion) ---
  hasRole(roles: string[]): boolean {
    const profile = this.userProfile();
    return profile ? roles.includes(profile.role) : false;
  }

  // --- MANEJO DE ERRORES EN ESPAÑOL MEXICANO ---
  private handleAuthError(err: any): void {
    const errorCode = err.code;
    let message = 'Error desconocido. Intenta de nuevo.';

    switch (errorCode) {
      case 'auth/invalid-email':
        message = 'El correo electrónico no es válido.';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta ha sido deshabilitada.';
        break;
      case 'auth/user-not-found':
        message = 'No existe una cuenta con este correo.';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta.';
        break;
      case 'auth/invalid-credential':
        message = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        break;
      case 'auth/email-already-in-use':
        message = 'Ya existe una cuenta con este correo.';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres.';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Espera un momento.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Inicio de sesión cancelado.';
        break;
    }

    this.error.set(message);
  }
}
