import { useMemo } from 'react';
import { AnnotationsWithText, Direction, TextMappingWithText, TextLabelWithText, TextRangeWithText } from '@common/annotations.ts';

export interface TextMappingSlice {
  description: string;
  ranges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
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

  constructor(mapping: TextMappingWithText, direction: Direction) {
    this.description = mapping.description;
    this.ranges = direction === "lhs" ? mapping.lhsRanges : mapping.rhsRanges;
    this.isWarning = mapping.isWarning;
    this.isError = mapping.isError;
  }
}

export function useAnnotationsSlice(
  annotations: AnnotationsWithText,
  direction: Direction
): AnnotationsSlice {
  return useMemo(() => {
    return {
      mappings: annotations.mappings.map(mapping => new TextMappingSliceWrapped(mapping, direction)),
      labels: direction === "lhs" ? annotations.lhsLabels : annotations.rhsLabels,
    };
  }, [annotations, direction]);
} 