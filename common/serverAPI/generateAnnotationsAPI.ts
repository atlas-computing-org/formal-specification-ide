import { Annotations, TextRange } from "@common/annotations.ts";

export interface GenerateAnnotationsRequest {
  lhsText: string;
  rhsText: string;
  currentAnnotations: Annotations<TextRange>;
  useDemoCache: boolean;
}