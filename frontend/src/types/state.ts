import { AnnotationSets, AnnotationsWithText, DatasetWithText } from '@common/annotations.ts';

export type LeftTabMode = 'pdf' | 'full-text' | 'selected-text';
export type RightTabMode = 'pre-written' | 'generated';

export interface AppState {
  dataset: DatasetWithText;
  highlights: AnnotationsWithText;

  // FIXME these are hacks
  pdfSrc: string;
  fullText: string;

  // Developer-only features
  currentAnnotationSets: AnnotationSets;

  // Debug info
  lastRawModelOutput: string;
  allRawModelOutputs: string[];
} 