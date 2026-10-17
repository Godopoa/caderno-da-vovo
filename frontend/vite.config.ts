import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/sitemap.xml': 'http://localhost:3333',
      '/robots.txt': 'http://localhost:3333',
      '/opensearch.xml': 'http://localhost:3333',
      '/indexnow-key.txt': 'http://localhost:3333',
      '/caderno-vovo-indexnow-2026.txt': 'http://localhost:3333',
    },
  },
});

