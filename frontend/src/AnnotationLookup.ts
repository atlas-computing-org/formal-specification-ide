import { TextRangeWithText } from '@common/annotations.ts';
import { AnnotationsSlice } from './AnnotationsSlice.ts';

export interface AnnotationLookup {
  getAnnotationsForIndex(index: number): AnnotationsSlice;
}

export class AnnotationLookupImpl implements AnnotationLookup {
  private readonly annotations: AnnotationsSlice;

  constructor(annotations: AnnotationsSlice) {
    this.annotations = annotations;
  }

  private static matchesIndex(range: TextRangeWithText[], index: number): boolean {
    return range.some(range => range.start <= index && index < range.end);
  }

  getAnnotationsForIndex(index: number): AnnotationsSlice {
    return {
      mappings: this.annotations.mappings.filter(mapping => AnnotationLookupImpl.matchesIndex(mapping.ranges, index)),
      labels: this.annotations.labels.filter(label => AnnotationLookupImpl.matchesIndex(label.ranges, index))
    }
  }
}

export class AnnotationAndHighlightsLookup {
  private readonly _annotations: AnnotationLookup;
  private readonly _highlights: AnnotationLookup;

  constructor(annotations: AnnotationLookup, highlights: AnnotationLookup) {
    this._annotations = annotations;
    this._highlights = highlights;
  }

  get annotations(): AnnotationLookup {
    return this._annotations;
  }

  get highlights(): AnnotationLookup {
    return this._highlights;
  }
}