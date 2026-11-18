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

import { UserProfile, UserRole } from '../types';

const VALID_ROLES: UserRole[] = ['admin', 'planner', 'technician', 'viewer'];

export function mapAuthErrorToSpanishMX(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus credenciales e intenta de nuevo.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Intenta iniciar sesión con tu contraseña.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada por el administrador.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana de autenticación antes de completar el ingreso.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para continuar.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Este método de acceso no está habilitado en la consola de Firebase. Usa Google o Modo Demo.';
    case 'auth/network-request-failed':
      return 'Sin conexión de red con los servicios de autenticación. Puedes ingresar con Modo Demo.';
    default:
      return err?.message || 'No fue posible iniciar sesión. Intenta nuevamente.';
  }
}


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

  clearError(): void {
    this.error.set(null);
  }

  formatRoleLabel(role: UserRole): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'planner': return 'Planeador';
      case 'technician': return 'Técnico';
      default: return 'Observador';
    }
  }

  async loginWithEmail(email: string, password: string): Promise<boolean> {
    return this.login(email, password);
  }

  async registerWithEmail(email: string, password: string, displayName: string): Promise<boolean> {
    return this.register(email, password, displayName);
  }

  async loginDemo(preferredRole: UserRole = 'planner'): Promise<boolean> {
    const ok = await this.loginAsDemo();
    if (ok) {
      const current = this.userProfile();
      if (current) {
        this.userProfile.set({ ...current, role: preferredRole });
      }
    }
    return ok;
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
    const token = await user.getIdTokenResult();
    const claimRole = this.roleFromClaims(token.claims as Record<string, unknown>);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const stored = userDoc.data() as UserProfile;
        this.userProfile.set({
          ...stored,
          role: claimRole ?? 'viewer'
        });
      } else {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'viewer',
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
        this.userProfile.set({ ...profile, role: claimRole ?? 'viewer' });
      }
    } catch (error) {
      console.error('Error sincronizando perfil de usuario:', error);
      this.userProfile.set({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: claimRole ?? 'viewer'
      });
    }
  }

  // --- HELPER PARA CONTROL DE ACCESO POR ROLES (de Edithion) ---
  hasRole(roles: string[]): boolean {
    const profile = this.userProfile();
    return profile ? roles.includes(profile.role) : false;
  }

  // --- MANEJO DE ERRORES EN ESPAÑOL MEXICANO ---
  private handleAuthError(err: unknown): void {
    this.error.set(mapAuthErrorToSpanishMX(err));
  }

  private roleFromClaims(claims: Record<string, unknown> | undefined): UserRole | null {
    const value = claims?.['role'];
    return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
      ? (value as UserRole)
      : null;
  }
}
