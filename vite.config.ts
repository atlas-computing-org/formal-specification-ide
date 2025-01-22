import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  server: {
    open: true, // Automatically open the browser when the server starts
    port: 3000,
  },
  build: {
    outDir: 'dist', // Output directory for the build
  },
});
