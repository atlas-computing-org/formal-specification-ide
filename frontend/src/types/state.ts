import { AnnotationSets, AnnotationsWithText, DatasetWithText } from '@common/annotations.ts';

export interface AppState {
  dataset: DatasetWithText;
  highlights: AnnotationsWithText;
  pdfSrc: string;
  fullText: string;

  // Developer-only features
  currentAnnotationSets: AnnotationSets;

  // Debug info
  lastRawModelOutput: string;
  allRawModelOutputs: string[];
} 