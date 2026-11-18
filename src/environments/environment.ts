// environment.ts — Solo para desarrollo local (ng serve)
// La API key de Gemini no vive en el cliente. Se configura como secreto de Functions.
export const environment = {
  production: false,
  functionsRegion: 'us-central1',
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
