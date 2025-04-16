import { AnnotationsSlice } from "./AnnotationsSlice.ts";
import { TextRange } from "@common/annotations.ts";

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

export class TextPartitionIndices {
  private readonly sortedIndices: number[];

  private constructor(sortedIndices: number[]) {
    this.sortedIndices = sortedIndices;
  }

  static fromTextAndAnnotations(text: string, annotations: AnnotationsSlice): TextPartitionIndices {
    return new TextPartitionIndices(getSortedPartitionIndices(text, annotations));
  }

  getSortedIndices(): number[] {
    return this.sortedIndices;
  }
}