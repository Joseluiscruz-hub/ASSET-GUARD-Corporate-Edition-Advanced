// firebase-init.ts - AssetGuard Corporate Edition Advanced
// UNICA fuente de inicializacion de Firebase.
// Exporta: firebaseApp, auth, db (Firestore), rtdb (Realtime Database), functions

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getFunctions, Functions } from 'firebase/functions';
import { environment } from './environments/environment';

let firebaseApp: FirebaseApp = {} as FirebaseApp;
let auth: Auth = {} as Auth;
let db: Firestore = {} as Firestore;
let rtdb: Database = {} as Database;
let functions: Functions = {} as Functions;
let firebaseReady = false;

try {
  const app = getApps().length === 0
    ? initializeApp(environment.firebase)
    : getApps()[0];
  firebaseApp = app;
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  functions = getFunctions(app, environment.functionsRegion || 'us-central1');
  firebaseReady = true;
} catch (e) {
  console.warn('[AssetGuard] Firebase inicializado en modo DEMO. Para activar persistencia real, agrega los secretos de Firebase en GitHub Actions → Settings → Secrets.');
}

export { firebaseApp, auth, db, rtdb, functions, firebaseReady };
