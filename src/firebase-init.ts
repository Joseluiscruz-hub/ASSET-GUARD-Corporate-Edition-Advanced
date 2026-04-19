// =======================================================================================
// firebase-init.ts — AssetGuard Corporate Edition Advanced
// ÚNICA fuente de inicialización de Firebase.
// Exporta: firebaseApp, auth, db (Firestore), rtdb (Realtime Database)
// =======================================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { environment } from './environments/environment';

// Evita doble inicialización (importante en HMR / dev mode)
const firebaseApp: FirebaseApp = getApps().length === 0
  ? initializeApp(environment.firebase)
  : getApps()[0];

const auth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);
const rtdb: Database = getDatabase(firebaseApp);

export { firebaseApp, auth, db, rtdb };
