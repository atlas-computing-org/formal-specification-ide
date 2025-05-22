import { Dataset } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";

export interface SaveDatasetRequest {
  dataset: Dataset;
  datasetName: string;
  annotationsName: string;
}

export type SaveDatasetResponse = undefined | ErrorResponse; 