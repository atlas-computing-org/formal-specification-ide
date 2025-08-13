import { Request } from 'express';
import { Logger } from '../Logger.ts';
import { PROMPTS_DIR, readFileAllowOverride } from '../util/fileUtils.ts';
import { GetAllAgentPromptsResponse } from '@common/serverAPI/getAllAgentPromptsAPI.ts';
import { ErrorResponse } from '@common/serverAPI/ErrorResponse.ts';
import path from 'path';
import { promises as fs } from 'fs';
import { validateFilename } from '../util/pathValidation.ts';

export const getAllAgentPromptsHandler = async (_req: Request, logger: Logger): Promise<GetAllAgentPromptsResponse> => {
  try {
    const entries = await fs.readdir(PROMPTS_DIR, { withFileTypes: true });
    const promptFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
      .filter(entry => validateFilename(entry.name, ['.txt'])) // Additional validation
      .map(entry => entry.name);

    const prompts = await Promise.all(
      promptFiles.map(async (fileName) => {
        try {
          const filePath = path.join(PROMPTS_DIR, fileName);
          
          // Additional path validation
          if (!filePath.startsWith(PROMPTS_DIR)) {
            logger.warn(`Skipping file with invalid path: ${fileName}`);
            return null;
          }
          
          const fileContent = await readFileAllowOverride(filePath, logger);
          
          // Validate file content length
          if (fileContent.length > 1000000) { // 1MB limit
            logger.warn(`Skipping file with excessive content length: ${fileName}`);
            return null;
          }
          
          return { fileName, fileContent };
        } catch (error) {
          logger.error(`Failed to read prompt file ${fileName}: ${error}`);
          return null;
        }
      })
    );

    // Filter out null values from failed reads
    const validPrompts = prompts.filter(prompt => prompt !== null);

    return { data: { prompts: validPrompts } };
  } catch (e) {
    return { error: `Failed to read agent prompts: ${e}` } as ErrorResponse;
  }
}; 