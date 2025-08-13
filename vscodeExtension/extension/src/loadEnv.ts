import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../../../.env.config');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn(`Environment file not found at ${envPath}`);
}