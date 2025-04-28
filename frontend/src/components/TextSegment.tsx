import React from 'react';
import { AnnotationsSlice } from '../utils/AnnotationsSlice.ts';
import { useAnnotationSeverity } from '../hooks/useAnnotationSeverity.ts';
import { TextRangeWithText } from '@common/annotations.ts';

// Type definitions
interface TextSegmentProps {
  startIndex: number;
  text: string;
  annotations: AnnotationsSlice;
  highlights: AnnotationsSlice;
  selectedRanges: TextRangeWithText[];
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  onClick: (index: number) => void;
}

// Component
export const TextSegment: React.FC<TextSegmentProps> = ({
  startIndex,
  text,
  annotations,
  highlights,
  selectedRanges,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  // Hooks
  const annotationSeverity = useAnnotationSeverity(annotations);
  const highlightSeverity = useAnnotationSeverity(highlights);
  
  // Derived values
  const hasHighlights = highlights.mappings.length > 0 || highlights.labels.length > 0;
  const hasAnnotations = annotations.mappings.length > 0 || annotations.labels.length > 0;
  const isSelected = selectedRanges.some(range => 
    range.start <= startIndex && startIndex + text.length <= range.end
  );

  const highlightClass = hasHighlights ? `highlight-${highlightSeverity}` : "";
  const annotationClass = hasAnnotations ? annotationSeverity : "";
  const selectedClass = isSelected ? "selected-text" : "";

  // Event handlers
  const handleClick = () => onClick(startIndex);
  const handleMouseEnter = () => onMouseEnter(startIndex);
  const handleMouseLeave = () => onMouseLeave();

  // Main render
  return (
    <span
      className={`${highlightClass} ${annotationClass} ${selectedClass}`}
      data-start-index={startIndex}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  );
}; 
