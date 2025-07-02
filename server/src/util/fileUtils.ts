import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { Logger } from '../Logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '../../..');
const SERVER_DIR = path.join(ROOT_DIR, '/server');
export const SERVER_DATA_DIR = path.join(SERVER_DIR, '/data');
export const SERVER_SRC_DIR = path.join(SERVER_DIR, '/src');
export const EXPERIMENTS_DIR = path.join(ROOT_DIR, '/experiments');
export const PROMPTS_DIR = path.join(SERVER_SRC_DIR, 'agents/prompts');

export const overrideFileExtension = '.OVERRIDE';

/**
 * Writes content to an override file with the .OVERRIDE extension
 * @param filePath - The original file path
 * @param fileContent - The content to write to the override file
 */
export async function writeFileOverride(filePath: string, fileContent: string): Promise<void> {
    const overridePath = `${filePath}${overrideFileExtension}`;
    await fs.writeFile(overridePath, fileContent, 'utf-8');
}

/**
 * Reads a file, preferring the override version if it exists
 * @param filePath - The original file path to read
 * @returns The content of the file (override version if it exists, otherwise original)
 */
export async function readFileAllowOverride(filePath: string, logger: Logger): Promise<string> {
    const overridePath = `${filePath}${overrideFileExtension}`;
    
    try {
        // First try to read the override file
        const overrideContent = await fs.readFile(overridePath, 'utf-8');
        logger.warn(`Using override file for ${filePath}`);
        return overrideContent;
    } catch (error) {
        // If override file doesn't exist, read the original file
        logger.debug(`readFileAllowOverride: No override found, reading original file ${filePath}`);
        return await fs.readFile(filePath, 'utf-8');
    }
}