import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Automatically open the browser when the server starts
    port: 3000,
  },
  build: {
    outDir: 'public/dist', // Output directory for the build
  },
});

