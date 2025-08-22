import { Direction, AnnotationsWithText, TextMappingWithText, TextLabelWithText, TextRangeWithText } from '@common/annotations.ts';

export interface TextMappingSlice {
  description: string;
  ranges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
  quality?: 1 | 2 | 3 | 4;
}

export interface AnnotationsSlice {
  mappings: TextMappingSlice[];
  labels: TextLabelWithText[];
}

export class TextMappingSliceWrapped implements TextMappingSlice {
  readonly description: string;
  readonly ranges: TextRangeWithText[];
  readonly isWarning?: boolean;
  readonly isError?: boolean;
  readonly quality?: 1 | 2 | 3 | 4;

  constructor(mapping: TextMappingWithText, direction: Direction) {
    this.description = mapping.description;
    this.ranges = direction === "lhs" ? mapping.lhsRanges : mapping.rhsRanges;
    this.isWarning = mapping.isWarning;
    this.isError = mapping.isError;
    this.quality = mapping.quality;
  }
}

export class AnnotationsSliceWrapped implements AnnotationsSlice {
  readonly mappings: TextMappingSlice[];
  readonly labels: TextLabelWithText[];

  constructor(annotations: AnnotationsWithText, direction: Direction) {
    this.mappings = annotations.mappings.map(mapping => new TextMappingSliceWrapped(mapping, direction));
    this.labels = direction === "lhs" ? annotations.lhsLabels : annotations.rhsLabels;
  }
}