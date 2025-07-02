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
  showCategories: boolean;
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
  showCategories,
}) => {
  // Hooks
  const annotationSeverity = useAnnotationSeverity(annotations);
  const highlightSeverity = useAnnotationSeverity(highlights);
  
  // Derived values
  const hasHighlights = highlights.mappings.length > 0 || highlights.labels.length > 0;
  const hasAnnotations = annotations.mappings.length > 0 || annotations.labels.length > 0;
  const categories = annotations.labels
    .filter(label => label.category)
    .map(label => label.category!);
  const isSelected = selectedRanges.some(range => 
    range.start <= startIndex && startIndex + text.length <= range.end
  );

  const hasAnnotationsClass = hasAnnotations ? "has-annotations" : "";
  const highlightClass = hasHighlights ? "highlight" : "";
  const selectedClass = isSelected ? "selected-text" : "";

  const severityClass = hasHighlights ? highlightSeverity : (hasAnnotations ? annotationSeverity : "");
  const maxSeverityClass = hasAnnotations ? `max-severity-${annotationSeverity}` : "";
  const categoryClasses = showCategories && categories.length > 0 ?
    `category ${categories.map(category => `category-${category.toLowerCase()}`).join(' ')}` : '';

  // Event handlers
  const handleClick = () => onClick(startIndex);
  const handleMouseEnter = () => onMouseEnter(startIndex);
  const handleMouseLeave = () => onMouseLeave();

  // Main render
  return (
    <span
      className={`${hasAnnotationsClass} ${highlightClass} ${selectedClass} ${severityClass} ${maxSeverityClass} ${categoryClasses}`}
      data-start-index={startIndex}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  );
}; 
