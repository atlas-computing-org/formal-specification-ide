import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  server: {
    open: true, // Automatically open the browser when the server starts
    port: 3000,
  },
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'common')  // Alias for common code
    }
  },
  build: {
    outDir: 'dist', // Output directory for the build
  },
});
