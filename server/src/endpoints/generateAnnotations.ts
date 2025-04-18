import { Request, Response } from 'express';
import { annotate } from '../APIEndpoints/annotate.ts';
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse } from "@common/serverAPI/generateAnnotationsAPI.ts";
import { v4 as uuidv4 } from 'uuid';

var userUUID = uuidv4();

export function generateAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, GenerateAnnotationsRequest>, res: Response<GenerateAnnotationsResponse>): Promise<void> => {
    const { lhsText, rhsText, currentAnnotations, useDemoCache } = req.body;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`POST /generate-annotations (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");
    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    if (!lhsText) {
      const error = "lhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    if (!rhsText) {
      const error = "rhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    if (!currentAnnotations) {
      const error = "currentAnnotations is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    try {
      const response = await annotate(userUUID, lhsText, rhsText, currentAnnotations, useDemoCache, requestLogger);
      if ("error" in response) {
        requestLogger.error(`REQUEST FAILED: ${response.error}`);
        res.status(400).send(response);
        return;
      } else {
        requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
        res.json(response);
      }
    } catch (e) {
      const error = `Error generating annotations. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}