import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import { Logger } from '../Logger.ts';
import { DATA_DIR } from '../util/fileUtils.ts';
import { Counter } from '@common/util/Counter.ts';

export function getDatasetNamesHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request, res: Response): Promise<void> => {
    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`GET /getDatasetNames (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");

    try {
      const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
      const datasetNames = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      const response = { datasetNames };
      requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
      res.json(response);
    } catch (e) {
      const error = `Failed to read datasets directory. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(500).send({ error });
    }
  }
}