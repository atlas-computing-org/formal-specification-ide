import { AnnotationsWithText, DatasetWithText } from '@common/annotations.ts';

export type LeftTabMode = 'pdf' | 'full-text' | 'selected-text';
export type RightTabMode = 'pre-written' | 'generated';

export interface TabState {
  left: LeftTabMode;
  right: RightTabMode;
}

export interface AppState {
  dataset: DatasetWithText;
  highlights: AnnotationsWithText;

  // FIXME these are hacks
  pdfSrc: string;
  fullText: string;

  tabState: TabState;
  useDemoCache: boolean;

  // Developer-only features
  currentAnnotationSets: Record<string, AnnotationsWithText>;
  selectedAnnotationsSetName: string;

  // Debug info
  lastRawModelOutput: string;
  allRawModelOutputs: string[];
} 