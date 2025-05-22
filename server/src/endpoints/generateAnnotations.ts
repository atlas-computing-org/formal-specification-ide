import { Request } from 'express';
import { annotateGraphInvoke } from "../agents/graphs/annotateGraph.ts";
import { Logger } from '../Logger.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse  } from "@common/serverAPI/generateAnnotationsAPI.ts";
import { validateRequest } from "./endpointUtils.ts";

export const generateAnnotationsHandler = async (req: Request<{}, {}, GenerateAnnotationsRequest>, requestLogger: Logger): Promise<GenerateAnnotationsResponse> => {
  const { lhsText, rhsText, currentAnnotations, useDemoCache } = req.body;

  requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

  validateRequest(lhsText, "lhsText is required.");
  validateRequest(rhsText, "rhsText is required.");
  validateRequest(currentAnnotations, "currentAnnotations is required.");

  return await annotateGraphInvoke(lhsText, rhsText, currentAnnotations, useDemoCache, requestLogger);
}