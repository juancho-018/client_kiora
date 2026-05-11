// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 9095
  },
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    // Con PUBLIC_API_URL=/api el navegador pide /api/... al mismo origen; Vite reenvía al gateway.
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Mismo puerto que dev; el proxy solo aplica si no usas URL directa al gateway en dev (apiBase).
    preview: {
      port: 9095,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});