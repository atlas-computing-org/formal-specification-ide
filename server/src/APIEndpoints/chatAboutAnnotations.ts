import { Request, Response } from 'express';
import { chatWithAssistant } from '../annotation/annotate.ts';
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { ChatAboutAnnotationsRequest } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";
import { v4 as uuidv4 } from 'uuid';

var userUUID = uuidv4();

export function chatAboutAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, ChatAboutAnnotationsRequest>, res: Response) => {
    const { userInput, lhsText, rhsText, annotations, reset } = req.body;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`POST /chat-with-assistant (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");
    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    if (!userInput) {
      const error = "userInput is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      return res.status(400).send({ error });
    }

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

    if (!annotations) {
      const error = "annotations is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      return res.status(400).send({ error });
    }

    if (reset) {
      userUUID = uuidv4();
    }

    try {
      const response = await chatWithAssistant(userUUID, userInput, lhsText, rhsText, annotations, reset, requestLogger);
      requestLogger.debug(`RESPONSE!: ${response}`);
      requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
      res.json({ response });
    } catch (e) {
      const error = `Error chatting with assistant. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(500).send({ error });
    }
  }
}