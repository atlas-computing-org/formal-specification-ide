import { Request } from 'express';
import { Logger } from '../Logger.ts';
import { PROMPTS_DIR, writeFileOverride } from '../util/fileUtils.ts';
import { WriteAgentPromptOverrideRequest, WriteAgentPromptOverrideResponse } from '@common/serverAPI/writeAgentPromptOverrideAPI.ts';
import path from 'path';
import { validateFilename } from '../util/pathValidation.ts';

export const writeAgentPromptOverrideHandler = async (
  req: Request<{}, {}, WriteAgentPromptOverrideRequest>,
  _logger: Logger
): Promise<WriteAgentPromptOverrideResponse> => {
  const { fileName, fileContent } = req.body;
  
  // Validate input parameters
  if (!fileName || typeof fileName !== 'string') {
    return { error: 'Invalid fileName' };
  }
  
  if (!fileContent || typeof fileContent !== 'string') {
    return { error: 'Invalid fileContent' };
  }
  
  // Validate filename format and extension
  if (!validateFilename(fileName, ['.txt'])) {
    return { error: 'Invalid fileName format. Only .txt files are allowed.' };
  }
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { error: 'Invalid fileName' };
  }
  
  try {
    // Only allow writing to files in the prompts directory
    const filePath = path.join(PROMPTS_DIR, fileName);
    
    // Additional path validation
    if (!filePath.startsWith(PROMPTS_DIR)) {
      return { error: 'Invalid file path' };
    }
    
    // Validate file content length to prevent extremely large files
    if (fileContent.length > 1000000) { // 1MB limit
      return { error: 'File content too large' };
    }
    
    await writeFileOverride(filePath, fileContent);
    return { data: {} };
  } catch (e) {
    return { error: `Failed to write override: ${e}` };
  }
}; 