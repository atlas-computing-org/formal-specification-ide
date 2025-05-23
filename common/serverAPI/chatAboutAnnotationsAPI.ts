import { Annotations, TextRange } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";
import { SuccessResponse } from "./SuccessResponse.ts";

export interface ChatAboutAnnotationsRequest {
  userInput: string;
  lhsText: string;
  rhsText: string;
  annotations: Annotations<TextRange>;
  sessionId: string;
}

export type ChatAboutAnnotationsSuccessResponse = SuccessResponse<string>;

export type ChatAboutAnnotationsResponse = ChatAboutAnnotationsSuccessResponse | ErrorResponse;