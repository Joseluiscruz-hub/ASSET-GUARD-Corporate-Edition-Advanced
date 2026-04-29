// firebase-init.ts - AssetGuard Corporate Edition Advanced
// UNICA fuente de inicializacion de Firebase.
// Exporta: firebaseApp, auth, db (Firestore), rtdb (Realtime Database)

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { environment } from './environments/environment';

const isRealFirebaseConfig = (
  environment.firebase.apiKey &&
  environment.firebase.apiKey !== 'demo-api-key' &&
  environment.firebase.projectId &&
  environment.firebase.projectId !== 'demo-project'
);

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore | null = null;
let rtdb: Database | null = null;

try {
  firebaseApp = getApps().length === 0
    ? initializeApp(environment.firebase)
    : getApps()[0];

  auth = getAuth(firebaseApp);

  if (isRealFirebaseConfig) {
    db = getFirestore(firebaseApp);
    rtdb = getDatabase(firebaseApp);
  } else {
    console.warn('[AssetGuard] Firebase en modo DEMO. Configura los secretos de Firebase en GitHub Actions para activar persistencia real.');
  }
} catch (e) {
  console.error('[AssetGuard] Error inicializando Firebase:', e);
  firebaseApp = getApps()[0];
  auth = getAuth(firebaseApp);
}

export { firebaseApp, auth, db, rtdb };
