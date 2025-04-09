import { ErrorResponse } from "./ErrorResponse.ts";

export interface GetDatasetNamesSuccessResponse {
  data: {
    datasetNames: string[];
  }
}

export type GetDatasetNamesResponse = GetDatasetNamesSuccessResponse | ErrorResponse;