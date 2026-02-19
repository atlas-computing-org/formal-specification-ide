import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
    const envPath = path.resolve(__dirname, '..', '.env.config');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const webviewPort = process.env.WEBVIEW_PORT;

    return {
        plugins: [tailwindcss()],
        server: {
            port: Number(webviewPort) || 3002
        },
        build: {
            outDir: '../extension/media',
            emptyOutDir: true
        },
        base: './'
    }
});
