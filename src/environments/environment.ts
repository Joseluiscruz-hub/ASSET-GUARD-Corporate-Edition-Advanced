// environment.ts — Desarrollo local (`npm run dev` / Vite).
// La API key de Gemini no vive en el cliente. Se configura como secreto de Functions.
// Valores reales: copia .env.example a .env.local (gitignored) y rellena la config web
// de Firebase (Consola > Configuración del proyecto > Tus apps).
type VitePublicEnv = {
  VITE_FUNCTIONS_REGION?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_DATABASE_URL?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
};

function readEnv(name: keyof VitePublicEnv, fallback: string): string {
  const env = (import.meta as ImportMeta & { env?: VitePublicEnv }).env;
  const value = env?.[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export const environment = {
  production: false,
  functionsRegion: readEnv('VITE_FUNCTIONS_REGION', 'us-central1'),
  firebase: {
    apiKey:            readEnv('VITE_FIREBASE_API_KEY', 'demo-api-key'),
    authDomain:        readEnv('VITE_FIREBASE_AUTH_DOMAIN', 'demo-project.firebaseapp.com'),
    databaseURL:       readEnv('VITE_FIREBASE_DATABASE_URL', 'https://demo-project-default-rtdb.firebaseio.com'),
    projectId:         readEnv('VITE_FIREBASE_PROJECT_ID', 'demo-project'),
    storageBucket:     readEnv('VITE_FIREBASE_STORAGE_BUCKET', 'demo-project.appspot.com'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
    appId:             readEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef'),
  }
};