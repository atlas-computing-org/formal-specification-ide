import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../Logger.ts';
import { DATA_DIR } from '../util/fileUtils.ts';
import { Counter } from '@common/util/Counter.ts';
import { GetDatasetResponse } from "@common/serverAPI/getDatasetAPI.ts";
import { Annotations } from '@common/annotations.ts';

export function getDatasetHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request, res: Response<GetDatasetResponse>): Promise<void> => {
    const datasetName = req.params.datasetName;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`GET /getDataset/${datasetName} (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");

    if (!datasetName) {
      const error = "Dataset name is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).json({ error });
      return;
    }
    const datasetPath = path.join(DATA_DIR, datasetName);
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
        const content = await fs.readFile(path.join(datasetPath, filename), 'utf-8');
        const key = filename.replace(/\.json$/, '');
        annotations[key] = JSON.parse(content) as Annotations;
      }));
      const pdfUrl = `/data/${datasetName}/pdf.pdf`;
      const response = {
        lhsText: selectedText,
        rhsText: preWritten,
        annotations,
        fullText,
        pdfUrl,
      };
      requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
      res.json({ data: response });
    } catch (e) {
      const error = `Failed to read dataset files. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}