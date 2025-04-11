export type TextRange = {
  start: number;
  end: number;
};

export type TextLabel<T extends TextRange = TextRange> = {
  description: string;
  ranges: T[];
  isWarning?: boolean;
  isError?: boolean;
};

export type TextMapping<T extends TextRange = TextRange> = {
  description: string;
  lhsRanges: T[];
  rhsRanges: T[];
  isWarning?: boolean;
  isError?: boolean;
};

export interface Annotations<T extends TextRange = TextRange> {
  mappings: TextMapping<T>[];
  lhsLabels: TextLabel<T>[];
  rhsLabels: TextLabel<T>[];
}

export type AnnotationSets<T extends TextRange = TextRange> = { [key: string]: Annotations<T> };

export interface Dataset<T extends TextRange = TextRange> {
  lhsText: string;
  rhsText: string;
  annotations: Annotations<T>;
}

export interface MultiAnnotationsDataset<T extends TextRange = TextRange> {
  lhsText: string;
  rhsText: string;
  annotations: AnnotationSets<T>;
}

export type TextRangeWithText = TextRange & {
  text: string;
};
export type TextLabelWithText = TextLabel<TextRangeWithText>;
export type TextMappingWithText = TextMapping<TextRangeWithText>;
export type AnnotationsWithText = Annotations<TextRangeWithText>;
export type DatasetWithText = Dataset<TextRangeWithText>;

export type LabelType = "default" | "warning" | "error";
export type Direction = "lhs" | "rhs";

export function mergeAnnotations(first: Annotations, second: Annotations): Annotations {
  return {
    mappings: first.mappings.concat(second.mappings),
    lhsLabels: first.lhsLabels.concat(second.lhsLabels),
    rhsLabels: first.rhsLabels.concat(second.rhsLabels),
  };
}