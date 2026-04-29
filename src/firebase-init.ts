// firebase-init.ts - AssetGuard Corporate Edition Advanced
// UNICA fuente de inicializacion de Firebase.
// Exporta: firebaseApp, auth, db (Firestore), rtdb (Realtime Database)

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { environment } from './environments/environment';

// Inicializacion segura: si Firebase falla (config demo/invalida), la app sigue funcionando
let firebaseApp: FirebaseApp = {} as FirebaseApp;
let auth: Auth = {} as Auth;
let db: Firestore = {} as Firestore;
let rtdb: Database = {} as Database;

try {
  const app = getApps().length === 0
    ? initializeApp(environment.firebase)
    : getApps()[0];
  firebaseApp = app;
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
} catch (e) {
  console.warn('[AssetGuard] Firebase inicializado en modo DEMO. Para activar persistencia real, agrega los secretos de Firebase en GitHub Actions → Settings → Secrets.');
}

export { firebaseApp, auth, db, rtdb };
