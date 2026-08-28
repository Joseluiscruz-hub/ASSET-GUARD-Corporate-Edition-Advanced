// environment.ts — Solo para desarrollo local (ng serve)
// El demo público de GitHub Pages no incluye clave Gemini.
export const environment = {
  production: false,
  geminiApiKey: '',
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
