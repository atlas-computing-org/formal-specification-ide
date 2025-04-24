import { useMemo } from 'react';
import { AnnotationsSlice } from '../hooks/useAnnotationsSlice.ts';
import { TextRange } from '@common/annotations.ts';

function findUniqueIndices(mappingRanges: TextRange[], labelRanges: TextRange[]): Set<number> {
  const indices = new Set<number>();

  // Add all start and end indices from mappings and labels
  [...mappingRanges, ...labelRanges].forEach(range => {
    indices.add(range.start);
    indices.add(range.end);
  });

  return indices;
}

function getSortedPartitionIndices(text: string, annotations: AnnotationsSlice): number[] {
  // Get all indices that mark an annotation transition. Include start and end of text.
  const mappingRanges = annotations.mappings.flatMap(mapping => mapping.ranges);
  const labelRanges = annotations.labels.flatMap(label => label.ranges);
  const indices = findUniqueIndices(mappingRanges, labelRanges)
    .add(0)
    .add(text.length);
  const sortedIndices = Array.from(indices).sort((a, b) => a - b);
  return sortedIndices;
}

export function useTextPartitioning(text: string, annotations: AnnotationsSlice) {
  return useMemo(() => {
    const sortedIndices = getSortedPartitionIndices(text, annotations);
    
    return {
      getSortedIndices: () => sortedIndices,
      getPartitions: () => {
        const partitions: { start: number; end: number; text: string }[] = [];
        for (let i = 0; i < sortedIndices.length - 1; i++) {
          const start = sortedIndices[i];
          const end = sortedIndices[i + 1];
          partitions.push({
            start,
            end,
            text: text.substring(start, end)
          });
        }
        return partitions;
      }
    };
  }, [text, annotations]);
} 