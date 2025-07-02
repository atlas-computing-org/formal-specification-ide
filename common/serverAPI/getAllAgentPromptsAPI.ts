import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface AgentPromptFile {
  fileName: string;
  fileContent: string;
}

export interface GetAllAgentPromptsResponseData {
  prompts: AgentPromptFile[];
}

export type GetAllAgentPromptsSuccessResponse = SuccessResponse<GetAllAgentPromptsResponseData>;
export type GetAllAgentPromptsResponse = GetAllAgentPromptsSuccessResponse | ErrorResponse; 