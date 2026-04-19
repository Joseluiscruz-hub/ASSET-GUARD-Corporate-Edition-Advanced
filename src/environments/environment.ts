// =======================================================================================
// environment.ts — AssetGuard Corporate Edition Advanced
// ⚠️ NUNCA comitear con credenciales reales. Usar .env.local para la API key de Gemini.
// Reemplaza los valores de firebase con los de tu proyecto en console.firebase.google.com
// =======================================================================================

export const environment = {
  production: false,
  // Gemini API Key — se lee del .env.local (VITE_GEMINI_API_KEY)
  // Si no existe .env.local, esta queda vacía y la IA muestra mensaje de error claro.
  geminiApiKey: (import.meta as any).env?.['VITE_GEMINI_API_KEY'] ?? '',

  firebase: {
    apiKey:            (import.meta as any).env?.['VITE_FIREBASE_API_KEY']             ?? 'REEMPLAZA_AQUI',
    authDomain:        (import.meta as any).env?.['VITE_FIREBASE_AUTH_DOMAIN']         ?? 'REEMPLAZA_AQUI',
    databaseURL:       (import.meta as any).env?.['VITE_FIREBASE_DATABASE_URL']        ?? '',
    projectId:         (import.meta as any).env?.['VITE_FIREBASE_PROJECT_ID']          ?? 'REEMPLAZA_AQUI',
    storageBucket:     (import.meta as any).env?.['VITE_FIREBASE_STORAGE_BUCKET']      ?? 'REEMPLAZA_AQUI',
    messagingSenderId: (import.meta as any).env?.['VITE_FIREBASE_MESSAGING_SENDER_ID'] ?? 'REEMPLAZA_AQUI',
    appId:             (import.meta as any).env?.['VITE_FIREBASE_APP_ID']              ?? 'REEMPLAZA_AQUI',
  }
};
