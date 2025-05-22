import { Request } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../Logger.ts';
import { SERVER_DATA_DIR } from '../util/fileUtils.ts';
import { GetDatasetResponse } from "@common/serverAPI/getDatasetAPI.ts";
import { Annotations } from '@common/annotations.ts';
import { validateRequest } from "./endpointUtils.ts";

const getDataset = async (datasetName: string) => {
  const datasetPath = path.join(SERVER_DATA_DIR, datasetName);
  const [fullText, selectedText, preWritten] = await Promise.all([
    fs.readFile(path.join(datasetPath, 'full-text.txt'), 'utf-8'),
    fs.readFile(path.join(datasetPath, 'selected-text.txt'), 'utf-8'),
    fs.readFile(path.join(datasetPath, 'pre-written.txt'), 'utf-8'),
  ]);

  const files = await fs.readdir(datasetPath);
  const annotationFilenames = files.filter(filename => /^annotations(\-.+)?\.json$/.test(filename));
  const annotations: { [key: string]: Annotations } = {};
  await Promise.all(annotationFilenames.map(async (filename) => {
    const content = await fs.readFile(path.join(datasetPath, filename), 'utf-8');
    const key = filename.replace(/\.json$/, '');
    annotations[key] = JSON.parse(content) as Annotations;
  }));

  const pdfUrl = `/data/${datasetName}/pdf.pdf`;
  return {
    lhsText: selectedText,
    rhsText: preWritten,
    annotations,
    fullText,
    pdfUrl,
  };
}

export const getDatasetHandler = async (req: Request, requestLogger: Logger): Promise<GetDatasetResponse> => {
  const datasetName = req.params.datasetName;

  requestLogger.debug(`Request param: ${datasetName}`);

  validateRequest(datasetName, "Dataset name is required.");

  const dataset = await getDataset(datasetName);
  return { data: dataset };
}