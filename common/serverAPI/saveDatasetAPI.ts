import { Dataset } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface SaveDatasetRequest {
  dataset: Dataset;
  datasetName: string;
  annotationsName: string;
}

export type SaveDatasetSuccessResponse = SuccessResponse<{}>;

export type SaveDatasetResponse = SaveDatasetSuccessResponse | ErrorResponse; 