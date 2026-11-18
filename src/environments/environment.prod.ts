// Committed production defaults (demo placeholders).
// GitHub Actions overwrites this file at build time with Firebase secrets.
// Do not reference `process` here: it is not defined in the browser.
export const environment = {
  production: true,
  functionsRegion: 'us-central1',
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-project.firebaseapp.com',
    databaseURL: 'https://demo-project-default-rtdb.firebaseio.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  }
};
