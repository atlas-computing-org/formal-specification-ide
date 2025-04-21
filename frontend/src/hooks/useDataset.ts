import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { datasetService } from '../services/datasetService.ts';
import { AnnotationsWithText, TextRange, Dataset, TextRangeWithText, EMPTY_ANNOTATIONS }
  from '@common/annotations.ts';

function cacheTextRangeText(ranges: TextRange[], text: string): TextRangeWithText[] {
  return ranges.map(({start, end}) => ({
    start,
    end,
    text: text.substring(start, end),
  }));
}

function cacheDatasetText(dataset: Dataset): AnnotationsWithText {
  const { annotations, lhsText, rhsText } = dataset;
  return {
    mappings: annotations.mappings.map(mapping => ({
      ...mapping,
      lhsRanges: cacheTextRangeText(mapping.lhsRanges, lhsText),
      rhsRanges: cacheTextRangeText(mapping.rhsRanges, rhsText),
    })),
    lhsLabels: annotations.lhsLabels.map(label => ({
      ...label,
      ranges: cacheTextRangeText(label.ranges, lhsText),
    })),
    rhsLabels: annotations.rhsLabels.map(label => ({
      ...label,
      ranges: cacheTextRangeText(label.ranges, rhsText),
    })),
  };
}

function mergeAnnotations(first: AnnotationsWithText, second: AnnotationsWithText): AnnotationsWithText {
  return {
    mappings: first.mappings.concat(second.mappings),
    lhsLabels: first.lhsLabels.concat(second.lhsLabels),
    rhsLabels: first.rhsLabels.concat(second.rhsLabels),
  };
}

export const useDataset = () => {
  const { state, updateDataset, updateAnnotationSets } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  const loadDataset = async (name: string) => {
    try {
      setLoading(true);
      const response = await datasetService.getDataset(name);
      if ("error" in response) {
        throw new Error(response.error);
      }
      // Get the default annotations set
      const annotations = response.data.annotations['annotations'];
      // Convert AnnotationSets to AnnotationsWithText
      const { lhsText, rhsText } = response.data;
      const annotationsWithText = cacheDatasetText({ lhsText, rhsText, annotations });
      updateDataset({
        ...response.data,
        annotations: annotationsWithText,
      });
      updateAnnotationSets(response.data.annotations);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnnotations = async (useDemoCache: boolean) => {
    try {
      const { lhsText, rhsText, annotations } = state.dataset;

      setGenerating(true);
      setGenerationError(null);
      const response = await datasetService.generateAnnotations({
        lhsText,
        rhsText,
        currentAnnotations: annotations,
        useDemoCache,
      });
      if ("error" in response) {
        throw new Error(response.error);
      }

      const newAnnotations = cacheDatasetText({ lhsText, rhsText, annotations: response.data });
      const mergedAnnotations = mergeAnnotations(annotations, newAnnotations);

      // Update the dataset with the new annotations
      updateDataset({
        ...state.dataset,
        annotations: mergedAnnotations,
      });
    } catch (err) {
      setGenerationError(err as Error);
    } finally {
      setGenerating(false);
    }
  };

  const useAnnotationsSet = (name: string) => {
    const annotations = state.currentAnnotationSets[name] || EMPTY_ANNOTATIONS;
    const { lhsText, rhsText } = state.dataset;
    const annotationsWithText = cacheDatasetText({ lhsText, rhsText, annotations });
    updateDataset({
      ...state.dataset,
      annotations: annotationsWithText,
    });
  };

  return {
    dataset: state.dataset,
    loading,
    error,
    loadDataset,
    generating,
    generationError,
    generateAnnotations,
    useAnnotationsSet,
  };
};