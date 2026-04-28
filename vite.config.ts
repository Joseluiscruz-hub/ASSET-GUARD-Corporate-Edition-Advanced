import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  cacheDir: 'C:/temp/.vite-assetguard',
  plugins: [angular({ tsconfig: './tsconfig.json' })],
  base: '/ASSET-GUARD-Corporate-Edition-Advanced/',
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
            file.source = file.source.replace('<base href="./">', '<base href="/ASSET-GUARD-Corporate-Edition-Advanced/">');
          }
        }
      }
    }
  ]
});
