import { Request, Response } from 'express';
import { chatGraphInvoke } from "../agents/graphs/chatGraph.ts";
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { ErrorResponseWithDebugInfo } from '@common/serverAPI/ErrorResponseWithDebugInfo.ts';
import { GraphError } from "../agents/agent.ts";
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse, ChatAboutAnnotationsSuccessResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";

export function chatAboutAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, ChatAboutAnnotationsRequest>, res: Response<ChatAboutAnnotationsResponse>): Promise<void> => {
    const { userInput, lhsText, rhsText, annotations, sessionId } = req.body;

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

    try {
      const response: ChatAboutAnnotationsResponse = await chatGraphInvoke(userInput, lhsText, rhsText, annotations, sessionId, logger);
      if ("error" in response) {
        requestLogger.error(`REQUEST FAILED: ${response.error}`);
        res.status(400).send(response);
      } else {
        requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
        res.json(response);
      }
    } catch (e) {
      const error = `Error chatting with assistant. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}