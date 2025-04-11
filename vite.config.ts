import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

export default defineConfig(() => {

    const envPath = path.resolve(__dirname, '.env.config');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const port = Number(process.env.FRONTEND_PORT) || 3000

    return {
        root: path.resolve(__dirname, 'frontend'),
        server: {
            open: true, // Automatically open the browser when the server starts
            port: port,
        },
        define: {
            "__PORTS__": JSON.stringify({
                "FRONTEND_PORT": process.env.FRONTEND_PORT,
                "BACKEND_PORT": process.env.BACKEND_PORT,
                "WEBVIEW_PORT": process.env.WEBVIEW_PORT
            })
        },
        resolve: {
            alias: {
                '@common': path.resolve(__dirname, 'common')  // Alias for common code
            }
        },
        build: {
            outDir: 'dist', // Output directory for the build
        },
    }
});
