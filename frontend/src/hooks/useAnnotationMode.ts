import { useState, useCallback } from 'react';
import { Direction, TextRangeWithText, TextRange } from '@common/annotations.ts';
import { useAppContext } from '../context/AppContext.tsx';

interface UseAnnotationModeResult {
  isAnnotationMode: boolean;
  selectedRanges: {lhs: TextRangeWithText[], rhs: TextRangeWithText[]};
  handleTextSelection: (direction: Direction, newRange: TextRange) => void;
  handleAddAnnotation: () => void;
  handleCancelAnnotation: () => void;
  handleSetAnnotationMode: (isAnnotationMode: boolean) => void;
}

export function useAnnotationMode(): UseAnnotationModeResult {
  const { state, updateDataset } = useAppContext();
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedRanges, setSelectedRanges] = useState<{lhs: TextRangeWithText[], rhs: TextRangeWithText[]}>({lhs: [], rhs: []});

  const clearAnnotationMode = useCallback(() => {
    setSelectedRanges({lhs: [], rhs: []});
    setIsAnnotationMode(false);
  }, []);

  const handleSetAnnotationMode = useCallback((isAnnotationMode: boolean) => {
    if (isAnnotationMode) {
      setIsAnnotationMode(true);
    } else {
      clearAnnotationMode();
    }
  }, [clearAnnotationMode, setIsAnnotationMode]);

  const handleTextSelection = useCallback((direction: Direction, newRange: TextRange) => {
    if (!isAnnotationMode) return;

    // Create a TextRangeWithText
    const text = direction === 'lhs' ? state.dataset.lhsText : state.dataset.rhsText;
    const rangeText = text.slice(newRange.start, newRange.end);
    const rangeWithText: TextRangeWithText = {
      ...newRange,
      text: rangeText
    };

    // Append to existing selections
    setSelectedRanges(prev => ({
      ...prev,
      [direction]: [...prev[direction], rangeWithText]
    }));
  }, [isAnnotationMode, state.dataset.lhsText, state.dataset.rhsText]);

  const handleAddAnnotation = useCallback(() => {
    if (selectedRanges.lhs.length === 0 && selectedRanges.rhs.length === 0) {
      clearAnnotationMode();
      return;
    }

    const newAnnotations = { ...state.dataset.annotations };

    if (selectedRanges.lhs.length > 0 && selectedRanges.rhs.length > 0) {
      // Create a mapping
      const newMapping = {
        description: '',
        lhsRanges: selectedRanges.lhs,
        rhsRanges: selectedRanges.rhs,
        isError: false,
        isWarning: false
      };
      newAnnotations.mappings.push(newMapping);
    } else {
      // Create a label
      const direction = selectedRanges.lhs.length > 0 ? 'lhs' : 'rhs';
      const ranges = direction === 'lhs' ? selectedRanges.lhs : selectedRanges.rhs;
      const newLabel = {
        description: '',
        ranges,
        isError: false,
        isWarning: false
      };
      newAnnotations[`${direction}Labels`].push(newLabel);
    }

    updateDataset({
      ...state.dataset,
      annotations: newAnnotations
    });

    clearAnnotationMode();
  }, [state.dataset, selectedRanges, updateDataset, clearAnnotationMode]);

  const handleCancelAnnotation = useCallback(() => {
    clearAnnotationMode();
  }, [clearAnnotationMode]);

  return {
    isAnnotationMode,
    selectedRanges,
    handleTextSelection,
    handleAddAnnotation,
    handleCancelAnnotation,
    handleSetAnnotationMode,
  };
}