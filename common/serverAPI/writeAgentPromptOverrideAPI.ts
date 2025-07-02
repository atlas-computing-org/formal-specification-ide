import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface WriteAgentPromptOverrideRequest {
  fileName: string;
  fileContent: string;
}

export type WriteAgentPromptOverrideSuccessResponse = SuccessResponse<{}>;
export type WriteAgentPromptOverrideResponse = WriteAgentPromptOverrideSuccessResponse | ErrorResponse; 