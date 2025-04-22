import { useMemo } from 'react';
import { TextRangeWithText } from '@common/annotations.ts';
import { AnnotationsSlice } from '../AnnotationsSlice.ts';

export interface AnnotationLookup {
  getAnnotationsForIndex(index: number): AnnotationsSlice;
}

export function useAnnotationLookup(annotations: AnnotationsSlice): AnnotationLookup {
  return useMemo(() => {
    const matchesIndex = (range: TextRangeWithText[], index: number): boolean => {
      return range.some(range => range.start <= index && index < range.end);
    };

    return {
      getAnnotationsForIndex(index: number): AnnotationsSlice {
        return {
          mappings: annotations.mappings.filter(mapping => matchesIndex(mapping.ranges, index)),
          labels: annotations.labels.filter(label => matchesIndex(label.ranges, index))
        };
      }
    };
  }, [annotations]);
}

export function useAnnotationAndHighlightsLookup(
  annotations: AnnotationsSlice,
  highlights: AnnotationsSlice
): { annotations: AnnotationLookup; highlights: AnnotationLookup } {
  const annotationsLookup = useAnnotationLookup(annotations);
  const highlightsLookup = useAnnotationLookup(highlights);

  return useMemo(() => ({
    annotations: annotationsLookup,
    highlights: highlightsLookup
  }), [annotationsLookup, highlightsLookup]);
} 