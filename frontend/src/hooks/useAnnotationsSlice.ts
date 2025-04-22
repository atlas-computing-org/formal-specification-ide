import { useMemo } from 'react';
import { AnnotationsWithText, Direction, TextLabelWithText, TextMappingWithText, TextRangeWithText } from '@common/annotations.ts';
import { AnnotationsSlice, MatchableAnnotationsSlice, TextMappingSlice } from '../AnnotationsSlice.ts';

class TextMappingSliceWrapped implements TextMappingSlice {
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
): MatchableAnnotationsSlice {
  return useMemo(() => {
    const rangesAreIdentical = (range1: TextRangeWithText[], range2: TextRangeWithText[]): boolean => {
      if (range1.length !== range2.length) return false;
      return range1.every((range, index) => {
        const otherRange = range2[index];
        return range.start === otherRange.start && range.end === otherRange.end;
      });
    };

    const isSliceOf = (slice: TextMappingSlice, mapping: TextMappingWithText, direction: Direction): boolean => {
      const sourceRanges = direction === "lhs" ? mapping.lhsRanges : mapping.rhsRanges;
      return rangesAreIdentical(slice.ranges, sourceRanges) &&
        slice.description === mapping.description &&
        slice.isWarning === mapping.isWarning &&
        slice.isError === mapping.isError;
    };

    const getOriginalMapping = (mapping: TextMappingSlice): TextMappingWithText | undefined => {
      return annotations.mappings.find(originalMapping =>
        isSliceOf(mapping, originalMapping, direction));
    };

    const getMatchingMappingInOppositeText = (sourceMapping: TextMappingSlice): TextMappingSlice | undefined => {
      const originalMapping = getOriginalMapping(sourceMapping);
      const reverseDirection = direction === "lhs" ? "rhs" : "lhs";
      return originalMapping ? new TextMappingSliceWrapped(originalMapping, reverseDirection) : undefined;
    };

    return {
      mappings: annotations.mappings.map(mapping => new TextMappingSliceWrapped(mapping, direction)),
      labels: direction === "lhs" ? annotations.lhsLabels : annotations.rhsLabels,
      getMatchingMappingInOppositeText
    };
  }, [annotations, direction]);
} 