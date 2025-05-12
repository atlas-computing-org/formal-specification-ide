import { Annotations, TextRange } from "@common/annotations.ts";
import { DebugInfo } from "@common/DebugInfo.ts";
import { ErrorResponse } from "./ErrorResponse.ts";

export interface GenerateAnnotationsRequest {
  lhsText: string;
  rhsText: string;
  currentAnnotations: Annotations<TextRange>;
  useDemoCache: boolean;
}

export interface GenerateAnnotationsSuccessResponse {
  data: Annotations<TextRange>;
  debugInfo: DebugInfo;
}

export type GenerateAnnotationsResponse = GenerateAnnotationsSuccessResponse | ErrorResponse;