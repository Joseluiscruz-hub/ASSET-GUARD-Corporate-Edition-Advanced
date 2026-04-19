import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.json' })],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
