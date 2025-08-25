import { Request } from 'express';
import { SaveDatasetRequest, SaveDatasetSuccessResponse } from '@common/serverAPI/saveDatasetAPI.ts';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../Logger.ts';
import { SERVER_DATA_DIR } from '../util/fileUtils.ts';
import { RequestValidationError, validateRequest } from "./endpointUtils.ts";
import { validateDatasetName, validateFilename } from '../util/pathValidation.ts';

// Helper function to format annotations name
function formatAnnotationsName(name: string): string {
  if (name === 'annotations' || name.startsWith('annotations-')) {
    return name;
  }
  return `annotations-${name}`;
}

const validateDatasetDirectoryExists = async (datasetDir: string, errorMessage: string) => {
  try {
    await fs.access(datasetDir);
  } catch (error) {
    throw new RequestValidationError(errorMessage);
  }
}

export const saveDatasetHandler = async (req: Request<{}, {}, SaveDatasetRequest>, requestLogger: Logger): Promise<SaveDatasetSuccessResponse> => {
    const { dataset, datasetName, annotationsName } = req.body;

    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    validateRequest(dataset, "Dataset is required.");
    validateRequest(datasetName, "Dataset name is required.");
    validateRequest(annotationsName, "Annotations name is required.");

    // Validate dataset name format
    if (!validateDatasetName(datasetName)) {
      throw new RequestValidationError('Invalid dataset name format');
    }

    // Validate annotations name format
    if (!validateFilename(annotationsName, ['.json'])) {
      throw new RequestValidationError('Invalid annotations name format');
    }

    const datasetDir = path.join(SERVER_DATA_DIR, datasetName);
    
    // Additional path validation
    if (!datasetDir.startsWith(SERVER_DATA_DIR)) {
      throw new RequestValidationError('Invalid dataset path');
    }
    
    await validateDatasetDirectoryExists(datasetDir, `Dataset '${datasetName}' does not exist.`);

    try {
      // Save only the annotations for now
      const formattedName = formatAnnotationsName(annotationsName);
      const annotationsPath = path.join(datasetDir, `${formattedName}.json`);
      
      // Final path validation before writing
      if (!annotationsPath.startsWith(datasetDir)) {
        throw new RequestValidationError('Invalid annotations path');
      }
      
      // Validate the annotations data before saving
      if (!dataset.annotations || typeof dataset.annotations !== 'object') {
        throw new RequestValidationError('Invalid annotations data');
      }
      
      await fs.writeFile(annotationsPath, JSON.stringify(dataset.annotations, null, 2));
      return { data: {} };

    } catch (error) {
      const errorMessage = `Failed to save annotations: ${error instanceof Error ? error.message : String(error)}`;
      throw new Error(errorMessage);
    }
} 