import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The optional AI server (server/index.mjs) runs on 8787; the dev server proxies /api to it.
export default defineConfig({
  // relative base works on any static host path (e.g. GitHub Pages at /SlangStone/)
  base: './',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
