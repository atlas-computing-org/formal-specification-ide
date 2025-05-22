import { Request } from 'express';
import { SaveDatasetRequest } from '@common/serverAPI/saveDatasetAPI.ts';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../Logger.ts';
import { SERVER_DATA_DIR } from '../util/fileUtils.ts';
import { RequestValidationError, validateRequest } from "./endpointUtils.ts";

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

export const saveDatasetHandler = async (req: Request<{}, {}, SaveDatasetRequest>, requestLogger: Logger): Promise<void> => {
    const { dataset, datasetName, annotationsName } = req.body;

    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    validateRequest(dataset, "Dataset is required.");
    validateRequest(datasetName, "Dataset name is required.");
    validateRequest(annotationsName, "Annotations name is required.");

    const datasetDir = path.join(SERVER_DATA_DIR, datasetName);
    await validateDatasetDirectoryExists(datasetDir, `Dataset '${datasetName}' does not exist.`);

    try {
      // Save only the annotations for now
      const annotationsPath = path.join(datasetDir, `${formatAnnotationsName(annotationsName)}.json`);
      await fs.writeFile(annotationsPath, JSON.stringify(dataset.annotations, null, 2));

    } catch (error) {
      const errorMessage = `Failed to save annotations: ${error instanceof Error ? error.message : String(error)}`;
      throw new Error(errorMessage);
    }
} 