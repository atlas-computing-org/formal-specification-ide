import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { api, SERVER_BASE_URL } from '../services/api.ts';
import { cacheDatasetText } from '../utils/annotationCachingUtils.ts';
import { AnnotationsWithText, EMPTY_ANNOTATIONS } from '@common/annotations.ts';

function mergeAnnotations(first: AnnotationsWithText, second: AnnotationsWithText): AnnotationsWithText {
  return {
    mappings: first.mappings.concat(second.mappings),
    lhsLabels: first.lhsLabels.concat(second.lhsLabels),
    rhsLabels: first.rhsLabels.concat(second.rhsLabels),
  };
}

export const useDataset = () => {
  const { state, updateDataset, updateAnnotationSets, updateState } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  const loadDataset = async (name: string) => {
    try {
      setLoading(true);
      const response = await api.getDataset(name);
      if ("error" in response) {
        throw new Error(response.error);
      }
      // Get the default annotations set
      const annotations = response.data.annotations['annotations'];
      // Convert AnnotationSets to AnnotationsWithText
      const { lhsText, rhsText, fullText, pdfUrl } = response.data;
      const dataset = cacheDatasetText({ lhsText, rhsText, annotations });
      updateDataset(dataset);
      updateAnnotationSets(response.data.annotations);
      // Update pdfSrc and fullText
      updateState({
        pdfSrc: `${SERVER_BASE_URL}${pdfUrl}`,
        fullText,
      });
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
      const response = await api.generateAnnotations({
        lhsText,
        rhsText,
        currentAnnotations: annotations,
        useDemoCache,
      });
      console.log("Server's response:", response);

      // Update raw model output
      if (response.debugInfo?.rawModelOutput) {
        updateState({
          lastRawModelOutput: response.debugInfo.rawModelOutput,
          allRawModelOutputs: [...state.allRawModelOutputs, response.debugInfo.rawModelOutput],
        });
      }

      if ("error" in response) {
        throw new Error(response.error);
      }

      const newDataset = cacheDatasetText({ lhsText, rhsText, annotations: response.data });
      const mergedAnnotations = mergeAnnotations(annotations, newDataset.annotations);

      // Update the dataset with the new annotations
      updateDataset({
        ...state.dataset,
        annotations: mergedAnnotations,
      });
    } catch (err) {
      setGenerationError(err as Error);
      console.error("Error generating annotations:", err);
    } finally {
      setGenerating(false);
    }
  };

  const generateCategoryLabels = async () => {
    try {
      const { lhsText, rhsText, annotations } = state.dataset;

      setGenerating(true);
      setGenerationError(null);
      const response = await api.generateCategoryLabels({
        lhsText,
        rhsText,
        currentAnnotations: annotations,
      });
      console.log("Server's response:", response);

      // Update raw model output
      if (response.debugInfo?.rawModelOutput) {
        updateState({
          lastRawModelOutput: response.debugInfo.rawModelOutput,
          allRawModelOutputs: [...state.allRawModelOutputs, response.debugInfo.rawModelOutput],
        });
      }

      if ("error" in response) {
        throw new Error(response.error);
      }

      const newDataset = cacheDatasetText({ lhsText, rhsText, annotations: response.data });
      const mergedAnnotations = mergeAnnotations(annotations, newDataset.annotations);

      // Update the dataset with the new annotations
      updateDataset({
        ...state.dataset,
        annotations: mergedAnnotations,
      });
    } catch (err) {
      setGenerationError(err as Error);
      console.error("Error generating category labels:", err);
    } finally {
      setGenerating(false);
    }
  };

  const useAnnotationsSet = (name: string) => {
    const annotations = state.currentAnnotationSets[name] || EMPTY_ANNOTATIONS;
    const { lhsText, rhsText } = state.dataset;
    const dataset = cacheDatasetText({ lhsText, rhsText, annotations });
    updateDataset(dataset);
  };

  return {
    dataset: state.dataset,
    loading,
    error,
    loadDataset,
    generating,
    generationError,
    generateAnnotations,
    generateCategoryLabels,
    useAnnotationsSet,
  };
};