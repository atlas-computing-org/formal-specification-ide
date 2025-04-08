import { Request, Response } from 'express';
import { chatGraph } from "../agents/graphs/chatGraph.ts";
import { responseContent } from "../agents/agent.ts";
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";
import { v4 as uuidv4 } from 'uuid';

var userUUID = uuidv4();

export function chatAboutAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, ChatAboutAnnotationsRequest>, res: Response<ChatAboutAnnotationsResponse>): Promise<void> => {
    const { userInput, lhsText, rhsText, annotations, reset } = req.body;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`POST /chat-with-assistant (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");
    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    if (!userInput) {
      const error = "userInput is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

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

    if (!annotations) {
      const error = "annotations is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    if (reset) {
      userUUID = uuidv4();
    }

    try {
      const config = { configurable: { thread_id: userUUID } };
      const output = await chatGraph.invoke({ userInput, lhsText, rhsText, currentAnnotations: annotations, resetChat: reset, logger }, config);
      const response = responseContent(output);
      requestLogger.debug(`RESPONSE: ${response}`);
      res.json({ response });
    } catch (e) {
      const error = `Error chatting with assistant. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}