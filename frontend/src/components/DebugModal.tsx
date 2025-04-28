import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { Annotations, TextRange, AnnotationsWithText } from '@common/annotations.ts';

// Type definitions
interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to convert AnnotationsWithText to Annotations<TextRange>
function stripTextFromAnnotations(annotations: AnnotationsWithText): Annotations<TextRange> {
  return {
    mappings: annotations.mappings.map(mapping => ({
      description: mapping.description,
      lhsRanges: mapping.lhsRanges.map(({ start, end }) => ({ start, end })),
      rhsRanges: mapping.rhsRanges.map(({ start, end }) => ({ start, end })),
      isWarning: mapping.isWarning,
      isError: mapping.isError
    })),
    lhsLabels: annotations.lhsLabels.map(label => ({
      description: label.description,
      ranges: label.ranges.map(({ start, end }) => ({ start, end })),
      isWarning: label.isWarning,
      isError: label.isError
    })),
    rhsLabels: annotations.rhsLabels.map(label => ({
      description: label.description,
      ranges: label.ranges.map(({ start, end }) => ({ start, end })),
      isWarning: label.isWarning,
      isError: label.isError
    }))
  };
}

// Component
export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  // State and hooks
  const { state } = useAppContext();
  const [selectedOption, setSelectedOption] = useState<'last' | 'all' | 'annotations' | 'annotations-no-text'>('last');

  // Event handlers
  const handleOptionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value as 'last' | 'all' | 'annotations' | 'annotations-no-text');
  }, []);

  // Derived values
  const debugContent = useMemo(() => {
    switch (selectedOption) {
      case 'last':
        return state.lastRawModelOutput;
      case 'all':
        return state.allRawModelOutputs
          .map((output, index) => `---- RAW MODEL OUTPUT: ${index + 1} ----\n\n${output}`)
          .join('\n\n\n\n\n\n');
      case 'annotations':
        return JSON.stringify(state.dataset.annotations, null, 2);
      case 'annotations-no-text':
        return JSON.stringify(stripTextFromAnnotations(state.dataset.annotations), null, 2);
      default:
        return '';
    }
  }, [selectedOption, state.lastRawModelOutput, state.allRawModelOutputs, state.dataset.annotations]);

  // Main render
  return (
    <div id="debug-info-modal" className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div>
          <label htmlFor="debug-selector">Debug Info:</label>
          <select
            id="debug-selector"
            className="with-label"
            value={selectedOption}
            onChange={handleOptionChange}
          >
            <option value="last">Last Raw Model Output</option>
            <option value="all">All Raw Model Outputs</option>
            <option value="annotations-no-text">Current Annotations (JSON)</option>
            <option value="annotations">Current Annotations with Text (JSON)</option>
          </select>
        </div>
        <div id="debug-info-content" className={selectedOption.startsWith('annotations') ? 'json' : ''}>
          {debugContent}
        </div>
      </div>
    </div>
  );
}; 