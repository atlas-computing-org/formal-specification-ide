import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portsPath = path.resolve(__dirname, '..', '..', '.env.config');

dotenv.config();
dotenv.config({ path: portsPath });