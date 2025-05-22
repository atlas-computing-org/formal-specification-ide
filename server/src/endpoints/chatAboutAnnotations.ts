import { Request } from 'express';
import { chatGraphInvoke } from "../agents/graphs/chatGraph.ts";
import { Logger } from '../Logger.ts';
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";
import { validateRequest } from "./endpointUtils.ts";

export const chatAboutAnnotationsHandler = async (req: Request<{}, {}, ChatAboutAnnotationsRequest>, requestLogger: Logger): Promise<ChatAboutAnnotationsResponse> => {
  const { userInput, lhsText, rhsText, annotations, sessionId } = req.body;

  requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

  validateRequest(userInput, "userInput is required.");
  validateRequest(lhsText, "lhsText is required.");
  validateRequest(rhsText, "rhsText is required.");
  validateRequest(annotations, "annotations is required.");

  return await chatGraphInvoke(userInput, lhsText, rhsText, annotations, sessionId, requestLogger);
}