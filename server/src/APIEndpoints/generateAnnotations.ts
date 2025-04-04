import { Request, Response } from 'express';
import { annotate} from '../annotation/annotate.ts';
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { GenerateAnnotationsRequest } from "@common/serverAPI/generateAnnotationsAPI.ts";

export function generateAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, GenerateAnnotationsRequest>, res: Response) => {
    const { lhsText, rhsText, currentAnnotations, useDemoCache } = req.body;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`POST /generate-annotations (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");
    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    if (!lhsText) {
      const error = "lhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      return res.status(400).send({ error });
    }

    if (!rhsText) {
      const error = "rhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      return res.status(400).send({ error });
    }

    if (!currentAnnotations) {
      const error = "currentAnnotations is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      return res.status(400).send({ error });
    }

    try {
      const response = await annotate(lhsText, rhsText, currentAnnotations, useDemoCache, requestLogger);
      requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
      res.json({ response });
    } catch (e) {
      const error = `Error generating annotations. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(500).send({ error });
    }
  }
}