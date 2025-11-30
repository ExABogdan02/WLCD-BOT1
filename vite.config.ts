import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Vital for Electron to find files
  server: {
    port: 3000, // Matches your Electron main.js config
    strictPort: true,
  },
  build: {
    outDir: 'build',
  }
});