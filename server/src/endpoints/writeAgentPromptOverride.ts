import { Request } from 'express';
import { Logger } from '../Logger.ts';
import { PROMPTS_DIR, writeFileOverride } from '../util/fileUtils.ts';
import { WriteAgentPromptOverrideRequest, WriteAgentPromptOverrideResponse } from '@common/serverAPI/writeAgentPromptOverrideAPI.ts';
import path from 'path';

export const writeAgentPromptOverrideHandler = async (
  req: Request<{}, {}, WriteAgentPromptOverrideRequest>,
  _logger: Logger
): Promise<WriteAgentPromptOverrideResponse> => {
  const { fileName, fileContent } = req.body;
  if (!fileName || typeof fileName !== 'string' || !fileName.endsWith('.txt')) {
    return { error: 'Invalid fileName' };
  }
  try {
    // Only allow writing to files in the prompts directory
    const filePath = path.join(PROMPTS_DIR, fileName);
    await writeFileOverride(filePath, fileContent);
    return { data: {} };
  } catch (e) {
    return { error: `Failed to write override: ${e}` };
  }
}; 