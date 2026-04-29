// environment.ts — Solo para desarrollo local (ng serve)
// Crea un archivo .env.local con tus claves reales (nunca lo comitees)
export const environment = {
  production: false,
  geminiApiKey: '',          // <-- pon tu key aquí solo para pruebas locales
  firebase: {
    apiKey:            'demo-api-key',
    authDomain:        'demo-project.firebaseapp.com',
    databaseURL:       'https://demo-project-default-rtdb.firebaseio.com',
    projectId:         'demo-project',
    storageBucket:     'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId:             '1:123456789:web:abcdef',
  }
};
