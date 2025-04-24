import { AnnotationsWithText, Direction, TextMappingWithText, TextRangeWithText } from '@common/annotations.ts';
import { TextMappingSlice, TextMappingSliceWrapped } from '../hooks/useAnnotationsSlice.ts';

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

const getOriginalMapping = (annotations: AnnotationsWithText, sourceMapping: TextMappingSlice, sourceDirection: Direction): TextMappingWithText | undefined => {
  return annotations.mappings.find(originalMapping =>
    isSliceOf(sourceMapping, originalMapping, sourceDirection));
};

export const getMatchingMappingInOppositeText = (annotations: AnnotationsWithText, sourceMapping: TextMappingSlice,
    sourceDirection: Direction): TextMappingSlice | undefined => {
  const originalMapping = getOriginalMapping(annotations, sourceMapping, sourceDirection);
  const reverseDirection = sourceDirection === "lhs" ? "rhs" : "lhs";
  return originalMapping ? new TextMappingSliceWrapped(originalMapping, reverseDirection) : undefined;
};