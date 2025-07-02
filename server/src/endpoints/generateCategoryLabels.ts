import { Request } from 'express';
import { Logger } from '../Logger.ts';
import { GenerateCategoryLabelsRequest, GenerateCategoryLabelsResponse } from '@common/serverAPI/generateCategoryLabelsAPI.ts';
import { validateRequest } from './endpointUtils.ts';
import { blockCategoriesGraphInvoke } from '../agents/graphs/blockCategoriesGraph.ts';

export const generateCategoryLabelsHandler = async (req: Request<{}, {}, GenerateCategoryLabelsRequest>, requestLogger: Logger): Promise<GenerateCategoryLabelsResponse> => {
  const { lhsText, rhsText, currentAnnotations } = req.body;

  requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

  validateRequest(lhsText !== undefined && lhsText !== null, "LHS text is required.");
  validateRequest(rhsText !== undefined && rhsText !== null, "RHS text is required.");
  validateRequest(currentAnnotations !== undefined && currentAnnotations !== null, "Current annotations are required.");

  // Generate category labels for both LHS and RHS
  const [lhsLabels, rhsLabels] = await Promise.all([
    blockCategoriesGraphInvoke(lhsText, rhsText, "lhs", requestLogger),
    blockCategoriesGraphInvoke(lhsText, rhsText, "rhs", requestLogger)
  ]);

  // Merge the new labels with existing annotations
  const newAnnotations = {
    mappings: [],
    lhsLabels: lhsLabels.lhsLabels,
    rhsLabels: rhsLabels.rhsLabels,
  };

  return { data: newAnnotations };
}; 