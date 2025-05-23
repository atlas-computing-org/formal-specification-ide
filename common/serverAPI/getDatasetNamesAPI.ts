import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

interface GetDatasetNamesResponseData {
  datasetNames: string[];
}

export type GetDatasetNamesSuccessResponse = SuccessResponse<GetDatasetNamesResponseData>;

export type GetDatasetNamesResponse = GetDatasetNamesSuccessResponse | ErrorResponse;