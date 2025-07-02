import { Request } from 'express';
import { Logger } from '../Logger.ts';
import { PROMPTS_DIR, readFileAllowOverride } from '../util/fileUtils.ts';
import { GetAllAgentPromptsResponse } from '@common/serverAPI/getAllAgentPromptsAPI.ts';
import { ErrorResponse } from '@common/serverAPI/ErrorResponse.ts';
import path from 'path';
import { promises as fs } from 'fs';

export const getAllAgentPromptsHandler = async (_req: Request, _logger: Logger): Promise<GetAllAgentPromptsResponse> => {
  try {
    const entries = await fs.readdir(PROMPTS_DIR, { withFileTypes: true });
    const promptFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
      .map(entry => entry.name);

    const prompts = await Promise.all(
      promptFiles.map(async (fileName) => {
        const filePath = path.join(PROMPTS_DIR, fileName);
        const fileContent = await readFileAllowOverride(filePath);
        return { fileName, fileContent };
      })
    );

    return { data: { prompts } };
  } catch (e) {
    return { error: `Failed to read agent prompts: ${e}` } as ErrorResponse;
  }
}; 