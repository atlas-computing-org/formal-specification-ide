import { AnnotationSets } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

interface GetDatasetResponseData {
  lhsText: string;
  rhsText: string;
  annotations: AnnotationSets;
  fullText: string;
  pdfUrl: string;
}

export type GetDatasetSuccessResponse = SuccessResponse<GetDatasetResponseData>;

export type GetDatasetResponse = GetDatasetSuccessResponse | ErrorResponse;