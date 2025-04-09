import { Annotations, TextRange } from "@common/annotations.ts";
import { ErrorResponse } from "./ErrorResponse.ts";

export interface ChatAboutAnnotationsRequest {
  userInput: string;
  lhsText: string;
  rhsText: string;
  annotations: Annotations<TextRange>;
  reset: boolean;
}

export interface ChatAboutAnnotationsSuccessResponse {
  data: string;
}

export type ChatAboutAnnotationsResponse = ChatAboutAnnotationsSuccessResponse | ErrorResponse;