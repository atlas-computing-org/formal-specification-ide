export type TextRange = {
  start: number;
  end: number;
};

export type TextLabel = {
  label: string;
  ranges: TextRange[];
  isWarning?: boolean;
  isError?: boolean;
};

export type TextMapping = {
  label: string;
  lhsRanges: TextRange[];
  rhsRanges: TextRange[];
  isWarning?: boolean;
  isError?: boolean;
};

export interface Annotations {
  mappings: TextMapping[];
  lhsLabels: TextLabel[];
  rhsLabels: TextLabel[];
}

export type TextRangeWithText = {
  start: number;
  end: number;
  text: string;
};

export type TextLabelWithText = {
  label: string;
  ranges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
};

export type TextMappingWithText = {
  label: string;
  lhsRanges: TextRangeWithText[];
  rhsRanges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
};

export interface AnnotationsWithText {
  mappings: TextMappingWithText[];
  lhsLabels: TextLabelWithText[];
  rhsLabels: TextLabelWithText[];
}

export interface DatasetWithText {
  lhsText: string;
  rhsText: string;
  annotations: AnnotationsWithText;
}

export type LabelType = "default" | "warning" | "error";
