import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  cacheDir: '.vite',
  base: process.env['NODE_ENV'] === 'production' ? '/ASSET-GUARD-Corporate-Edition-Advanced/' : '/',
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
  build: {
    rollupOptions: {},
  },
  // Hook para forzar base href correcto en el HTML generado
  plugins: [
    angular({ tsconfig: './tsconfig.json' }),
    {
      name: 'fix-base-href',
      enforce: 'post',
      generateBundle(_, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'asset' && file.fileName === 'index.html') {
            const source = typeof file.source === 'string' ? file.source : file.source.toString();
            file.source = source.replace('<base href="./">', '<base href="/ASSET-GUARD-Corporate-Edition-Advanced/">');
          }
        }
      }
    }
  ]
});
