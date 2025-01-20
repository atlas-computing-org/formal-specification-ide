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

export class TextMappingSliceWrapped implements TextMappingSlice {
  private mapping: TextMappingWithText;
  private direction: Direction;

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

export class AnnotationsSliceImpl implements AnnotationsSlice {
  mappings: TextMappingSlice[];
  labels: TextLabelWithText[];

  constructor(mappings: TextMappingSlice[], labels: TextLabelWithText[]) {
    this.mappings = mappings;
    this.labels = labels;
  }

  static fromAnnotations(annotations: AnnotationsWithText, direction: Direction): AnnotationsSliceImpl {
    return {
      mappings: annotations.mappings.map(mapping => new TextMappingSliceWrapped(mapping, direction)),
      labels: direction === "lhs" ? annotations.lhsLabels : annotations.rhsLabels
    };
  };
}