import { Annotations } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";

export interface GetDatasetSuccessResponse {
  data: {
    lhsText: string;
    rhsText: string;
    annotations: Annotations;
    fullText: string;
    pdfUrl: string;
  }
}

export type GetDatasetResponse = GetDatasetSuccessResponse | ErrorResponse;