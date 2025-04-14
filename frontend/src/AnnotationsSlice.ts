import { AnnotationsWithText, Direction, TextLabelWithText, TextMappingWithText, TextRangeWithText }
  from '@common/annotations.ts';

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

export interface MatchableAnnotationsSlice extends AnnotationsSlice {
  getMatchingMappingInOppositeText(sourceMapping: TextMappingSlice): TextMappingSlice | undefined;
}

export class TextMappingSliceWrapped implements TextMappingSlice {
  private readonly mapping: TextMappingWithText;
  private readonly direction: Direction;

  constructor(mapping: TextMappingWithText, direction: Direction) {
    this.mapping = mapping;
    this.direction = direction;
  }

  get description(): string {
    return this.mapping.description;
  }

  get ranges(): TextRangeWithText[] {
    return this.direction === "lhs" ? this.mapping.lhsRanges : this.mapping.rhsRanges;
  }

  get isWarning(): boolean | undefined {
    return this.mapping.isWarning;
  }

  get isError(): boolean | undefined {
    return this.mapping.isError;
  }
}

export class AnnotationsSliceImpl implements MatchableAnnotationsSlice {
  readonly mappings: TextMappingSlice[];
  readonly labels: TextLabelWithText[];
  private readonly annotations: AnnotationsWithText;
  private readonly direction: Direction;

  constructor(mappings: TextMappingSlice[], labels: TextLabelWithText[], annotations: AnnotationsWithText, direction: Direction) {
    this.mappings = mappings;
    this.labels = labels;
    this.annotations = annotations;
    this.direction = direction;
  }

  private static rangesAreIdentical(range1: TextRangeWithText[], range2: TextRangeWithText[]): boolean {
    if (range1.length !== range2.length) return false;
    return range1.every((range, index) => {
      const otherRange = range2[index];
      return range.start === otherRange.start && range.end === otherRange.end;
    });
  }

  private static isSliceOf(slice: TextMappingSlice, mapping: TextMappingWithText, direction: Direction): boolean {
    const sourceRanges = direction === "lhs" ? mapping.lhsRanges : mapping.rhsRanges;
    return AnnotationsSliceImpl.rangesAreIdentical(slice.ranges, sourceRanges) &&
      slice.description === mapping.description &&
      slice.isWarning === mapping.isWarning &&
      slice.isError === mapping.isError;
  }

  private getOriginalMapping(mapping: TextMappingSlice): TextMappingWithText | undefined {
    return this.annotations.mappings.find(originalMapping =>
      AnnotationsSliceImpl.isSliceOf(mapping, originalMapping, this.direction));
  }

  getMatchingMappingInOppositeText(sourceMapping: TextMappingSlice): TextMappingSlice | undefined {
    const originalMapping = this.getOriginalMapping(sourceMapping);
    const reverseDirection = this.direction === "lhs" ? "rhs" : "lhs";
    return originalMapping ? new TextMappingSliceWrapped(originalMapping, reverseDirection) : undefined;
  }

  static fromAnnotations(annotations: AnnotationsWithText, direction: Direction): AnnotationsSliceImpl {
    return new AnnotationsSliceImpl(
      annotations.mappings.map(mapping => new TextMappingSliceWrapped(mapping, direction)),
      direction === "lhs" ? annotations.lhsLabels : annotations.rhsLabels,
      annotations,
      direction,
    );
  };
}