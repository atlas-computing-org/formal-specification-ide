import { Annotations, TextRange } from "@common/annotations.ts";

export interface ChatAboutAnnotationsRequest {
  userInput: string;
  lhsText: string;
  rhsText: string;
  annotations: Annotations<TextRange>;
  reset: boolean;
}