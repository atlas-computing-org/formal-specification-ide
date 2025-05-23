import { Annotations, TextRange } from "@common/annotations.ts";
import { DebugInfo } from "@common/serverAPI/DebugInfo.ts";
import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface GenerateCategoryLabelsRequest {
  lhsText: string;
  rhsText: string;
  currentAnnotations: Annotations<TextRange>;
}

export interface GenerateCategoryLabelsSuccessResponse extends SuccessResponse<Annotations<TextRange>> {
 debugInfo?: DebugInfo;
}

export type GenerateCategoryLabelsResponse = GenerateCategoryLabelsSuccessResponse | ErrorResponse; 