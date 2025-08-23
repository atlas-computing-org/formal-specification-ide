import { TextMappingWithText, TextLabelWithText } from '@common/annotations.ts';

/**
 * Generate a stable ID for an annotation based on its description and ranges.
 * This ID remains consistent even when annotation objects are recreated.
 */
export const generateAnnotationId = (annotation: TextMappingWithText | TextLabelWithText): string => {
  const description = annotation.description;
  const ranges = 'ranges' in annotation ? annotation.ranges : [...annotation.lhsRanges, ...annotation.rhsRanges];
  const rangesStr = JSON.stringify(ranges);
  return `${description}-${rangesStr}`;
};
