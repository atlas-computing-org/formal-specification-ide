import { useMemo } from 'react';
import { AnnotationsSlice } from '../hooks/useAnnotationsSlice.ts';
import { LabelType } from '@common/annotations.ts';

export function useAnnotationSeverity(annotations: AnnotationsSlice): LabelType {
  return useMemo(() => {
    if (annotations.mappings.some(mapping => mapping.isError === true) ||
        annotations.labels.some(label => label.isError === true)) {
      return "error";
    } else if (
        annotations.mappings.some(mapping => mapping.isWarning === true) ||
        annotations.labels.some(label => label.isWarning === true)) {
      return "warning";
    } else {
      return "default";
    }
  }, [annotations]);
} 