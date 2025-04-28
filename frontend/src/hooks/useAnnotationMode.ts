import { useState, useEffect, useCallback } from 'react';
import { Direction, TextRangeWithText, TextRange } from '@common/annotations.ts';
import { useAppContext } from '../context/AppContext.tsx';

interface UseAnnotationModeResult {
  isAnnotationMode: boolean;
  selectedRanges: {lhs: TextRangeWithText[], rhs: TextRangeWithText[]};
  handleTextSelection: (direction: Direction, newRange: TextRange) => void;
  handleAddAnnotation: () => void;
  handleCancelAnnotation: () => void;
  toggleAnnotationMode: () => void;
}

export function useAnnotationMode(): UseAnnotationModeResult {
  const { state, updateDataset } = useAppContext();
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedRanges, setSelectedRanges] = useState<{lhs: TextRangeWithText[], rhs: TextRangeWithText[]}>({lhs: [], rhs: []});

  // Keyboard event handler for annotation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          setIsAnnotationMode(true);
          break;
        case 'enter':
          if (isAnnotationMode && (selectedRanges.lhs.length > 0 || selectedRanges.rhs.length > 0)) {
            handleAddAnnotation();
          }
          break;
        case 'escape':
          if (isAnnotationMode) {
            handleCancelAnnotation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnnotationMode, selectedRanges]);

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
    if (selectedRanges.lhs.length === 0 && selectedRanges.rhs.length === 0) return;

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

    // Reset selection and exit annotation mode
    setSelectedRanges({lhs: [], rhs: []});
    setIsAnnotationMode(false);
  }, [state.dataset, selectedRanges, updateDataset]);

  const handleCancelAnnotation = useCallback(() => {
    setSelectedRanges({lhs: [], rhs: []});
    setIsAnnotationMode(false);
  }, []);

  const toggleAnnotationMode = useCallback(() => {
    if (isAnnotationMode) {
      handleCancelAnnotation();
    } else {
      setIsAnnotationMode(true);
    }
  }, [isAnnotationMode, handleCancelAnnotation]);

  return {
    isAnnotationMode,
    selectedRanges,
    handleTextSelection,
    handleAddAnnotation,
    handleCancelAnnotation,
    toggleAnnotationMode
  };
}