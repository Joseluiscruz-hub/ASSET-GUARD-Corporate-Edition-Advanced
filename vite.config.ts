import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  cacheDir: 'C:/temp/.vite-assetguard',
  plugins: [angular({ tsconfig: './tsconfig.json' })],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  optimizeDeps: {
    force: true,
    include: [
      '@angular/common',
      '@angular/core',
      '@angular/router',
      'rxjs',
      'dompurify'
    ]
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
