import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://huz3yn.github.io/huseyn-portfolio/ in production.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/huseyn-portfolio/' : '/',
  plugins: [react()],
  server: { port: 5173 },
}));
