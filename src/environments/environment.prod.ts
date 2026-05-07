export const environment = {
  production: true,
  geminiApiKey: process.env['GEMINI_API_KEY'] || '',
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || 'demo-api-key',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || 'demo-project.firebaseapp.com',
    databaseURL: process.env['FIREBASE_DATABASE_URL'] || 'https://demo-project-default-rtdb.firebaseio.com',
    projectId: process.env['FIREBASE_PROJECT_ID'] || 'demo-project',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || 'demo-project.appspot.com',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '123456789',
    appId: process.env['FIREBASE_APP_ID'] || '1:123456789:web:abcdef',
  }
};
