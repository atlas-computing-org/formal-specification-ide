import React from 'react';
import { AnnotationsSlice } from '../AnnotationsSlice.ts';
import { useAnnotationSeverity } from '../hooks/useAnnotationSeverity.ts';

interface TextSegmentProps {
  startIndex: number;
  text: string;
  annotations: AnnotationsSlice;
  highlights: AnnotationsSlice;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  onClick: (index: number) => void;
}

export const TextSegment: React.FC<TextSegmentProps> = ({
  startIndex,
  text,
  annotations,
  highlights,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const annotationSeverity = useAnnotationSeverity(annotations);
  const highlightSeverity = useAnnotationSeverity(highlights);
  
  const hasHighlights = highlights.mappings.length > 0 || highlights.labels.length > 0;
  const hasAnnotations = annotations.mappings.length > 0 || annotations.labels.length > 0;

  const highlightClass = hasHighlights ? `highlight-${highlightSeverity}` : "";
  const annotationClass = hasAnnotations ? annotationSeverity : "";

  const handleClick = () => onClick(startIndex);
  const handleMouseEnter = () => onMouseEnter(startIndex);
  const handleMouseLeave = () => onMouseLeave();

  return (
    <span
      className={`${highlightClass} ${annotationClass}`}
      data-start-index={startIndex}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  );
}; 
