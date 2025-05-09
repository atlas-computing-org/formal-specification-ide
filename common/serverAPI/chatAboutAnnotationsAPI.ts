import { Annotations, TextRange } from "@common/annotations.ts";
import { ErrorResponseWithDebugInfo } from "./ErrorResponseWithDebugInfo.ts";

export interface ChatAboutAnnotationsRequest {
  userInput: string;
  lhsText: string;
  rhsText: string;
  annotations: Annotations<TextRange>;
  sessionId: string;
}

export interface ChatAboutAnnotationsSuccessResponse {
  data: string;
}

export type ChatAboutAnnotationsResponse = ChatAboutAnnotationsSuccessResponse | ErrorResponseWithDebugInfo;