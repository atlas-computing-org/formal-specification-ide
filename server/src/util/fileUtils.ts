import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '../../..');
const SERVER_DIR = path.join(ROOT_DIR, '/server');
export const SERVER_DATA_DIR = path.join(SERVER_DIR, '/data');
export const SERVER_SRC_DIR = path.join(SERVER_DIR, '/src');
export const EXPERIMENTS_DIR = path.join(ROOT_DIR, '/experiments');