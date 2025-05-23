import { Annotations, TextRange } from "@common/annotations.ts";
import { DebugInfo } from "@common/serverAPI/DebugInfo.ts";
import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface GenerateAnnotationsRequest {
  lhsText: string;
  rhsText: string;
  currentAnnotations: Annotations<TextRange>;
  useDemoCache: boolean;
}

export interface GenerateAnnotationsSuccessResponse extends SuccessResponse<Annotations<TextRange>> {
 debugInfo: DebugInfo;
}

export type GenerateAnnotationsResponse = GenerateAnnotationsSuccessResponse | ErrorResponse;