import { Request } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../Logger.ts';
import { SERVER_DATA_DIR } from '../util/fileUtils.ts';
import { GetDatasetResponse } from "@common/serverAPI/getDatasetAPI.ts";
import { Annotations } from '@common/annotations.ts';
import { validateRequest } from "./endpointUtils.ts";
import { validateDatasetName, validateAndSanitizePath } from '../util/pathValidation.ts';

const getDataset = async (datasetName: string) => {
  // Validate dataset name first
  if (!validateDatasetName(datasetName)) {
    throw new Error('Invalid dataset name');
  }

  // Safely construct and validate the dataset path
  const datasetPath = validateAndSanitizePath(datasetName, SERVER_DATA_DIR);
  if (!datasetPath) {
    throw new Error('Invalid dataset path');
  }

  try {
    const [fullText, selectedText, preWritten] = await Promise.all([
      fs.readFile(path.join(datasetPath, 'full-text.txt'), 'utf-8'),
      fs.readFile(path.join(datasetPath, 'selected-text.txt'), 'utf-8'),
      fs.readFile(path.join(datasetPath, 'pre-written.txt'), 'utf-8'),
    ]);

    const files = await fs.readdir(datasetPath);
    const annotationFilenames = files.filter(filename => /^annotations(\-.+)?\.json$/.test(filename));
    const annotations: { [key: string]: Annotations } = {};
    
    await Promise.all(annotationFilenames.map(async (filename) => {
      // Validate filename before reading
      if (!filename || typeof filename !== 'string') {
        return;
      }
      
      const content = await fs.readFile(path.join(datasetPath, filename), 'utf-8');
      const key = filename.replace(/\.json$/, '');
      try {
        annotations[key] = JSON.parse(content) as Annotations;
      } catch (parseError) {
        // Log error but continue processing other files
        console.error(`Failed to parse annotation file ${filename}:`, parseError);
      }
    }));

    const pdfUrl = `/data/${encodeURIComponent(datasetName)}/pdf.pdf`;
    return {
      lhsText: selectedText,
      rhsText: preWritten,
      annotations,
      fullText,
      pdfUrl,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read dataset: ${error.message}`);
    }
    throw new Error('Failed to read dataset');
  }
}

export const getDatasetHandler = async (req: Request, requestLogger: Logger): Promise<GetDatasetResponse> => {
  const datasetName = req.params.datasetName;

  requestLogger.debug(`Request param: ${datasetName}`);

  validateRequest(datasetName, "Dataset name is required.");
  
  // Additional validation for dataset name
  if (!validateDatasetName(datasetName)) {
    throw new Error('Invalid dataset name format');
  }

  const dataset = await getDataset(datasetName);
  return { data: dataset };
}