import React, { useCallback, useMemo } from 'react';
import { AnnotationsWithText, TextMappingWithText, TextLabelWithText } from '@common/annotations.ts';
import { useAppContext } from '../context/AppContext.tsx';
import { AnnotationRow, MappingClickHandler, LabelClickHandler } from './AnnotationRow.tsx';

interface AnnotationsPanelProps {
  className?: string;
  onMappingClick: MappingClickHandler;
  onLabelClick: LabelClickHandler;
  showCategories: boolean;
}

export const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({ 
  className = '',
  onMappingClick,
  onLabelClick,
  showCategories,
}) => {
  const { state, updateDataset, updateHighlights } = useAppContext();
  const { dataset, highlights } = state;

  const handleDescriptionChange = useCallback((item: TextMappingWithText | TextLabelWithText, newDescription: string) => {
    // Update the item's description
    item.description = newDescription;
    
    // Create a new annotations object with the updated item
    const newAnnotations: AnnotationsWithText = {
      mappings: dataset.annotations.mappings.map(m => 
        m === item ? { ...m, description: newDescription } : m
      ),
      lhsLabels: dataset.annotations.lhsLabels.map(l => 
        l === item ? { ...l, description: newDescription } : l
      ),
      rhsLabels: dataset.annotations.rhsLabels.map(l => 
        l === item ? { ...l, description: newDescription } : l
      ),
    };

    // Update the dataset with new annotations
    updateDataset({
      ...dataset,
      annotations: newAnnotations,
    });
  }, [dataset, updateDataset]);

  const handleMouseEnter = useCallback((item: TextMappingWithText | TextLabelWithText) => {
    let newHighlights: AnnotationsWithText;
    
    if ('lhsRanges' in item) {
      // It's a mapping
      newHighlights = {
        mappings: [item],
        lhsLabels: [],
        rhsLabels: [],
      };
    } else {
      // It's a label
      newHighlights = {
        mappings: [],
        lhsLabels: item === dataset.annotations.lhsLabels.find(l => l === item) ? [item] : [],
        rhsLabels: item === dataset.annotations.rhsLabels.find(l => l === item) ? [item] : [],
      };
    }

    updateHighlights(newHighlights);
  }, [dataset.annotations, updateHighlights]);

  const handleMouseLeave = useCallback(() => {
    updateHighlights({
      mappings: [],
      lhsLabels: [],
      rhsLabels: [],
    });
  }, [updateHighlights]);

  // Memoize the panel sections to prevent unnecessary re-renders
  const mappingsPanel = useMemo(() => (
    <div id="mappings-panel">
      <div className="header">Mappings</div>
      {dataset.annotations.mappings.map((mapping, index) => (
        <AnnotationRow
          key={index}
          item={mapping}
          isHighlighted={highlights.mappings.includes(mapping)}
          showCategories={showCategories}
          onMouseEnter={() => handleMouseEnter(mapping)}
          onMouseLeave={handleMouseLeave}
          onDescriptionChange={(newDescription) => handleDescriptionChange(mapping, newDescription)}
          onClick={onMappingClick}
          className="mapping"
          dataIndex={index}
        />
      ))}
    </div>
  ), [dataset.annotations.mappings, highlights.mappings, handleMouseEnter, handleMouseLeave, handleDescriptionChange, onMappingClick]);

  const lhsLabelsPanel = useMemo(() => (
    <div id="lhs-labels-panel">
      <div className="header">Left-Side Labels</div>
      {dataset.annotations.lhsLabels.map((label, index) => (
        <AnnotationRow
          key={index}
          item={label}
          isHighlighted={highlights.lhsLabels.includes(label)}
          showCategories={showCategories}
          onMouseEnter={() => handleMouseEnter(label)}
          onMouseLeave={handleMouseLeave}
          onDescriptionChange={(newDescription) => handleDescriptionChange(label, newDescription)}
          onClick={onLabelClick}
          direction="lhs"
          className="lhs-label"
          dataIndex={index}
        />
      ))}
    </div>
  ), [dataset.annotations.lhsLabels, highlights.lhsLabels, handleMouseEnter, handleMouseLeave, handleDescriptionChange, onLabelClick]);

  const rhsLabelsPanel = useMemo(() => (
    <div id="rhs-labels-panel">
      <div className="header">Right-Side Labels</div>
      {dataset.annotations.rhsLabels.map((label, index) => (
        <AnnotationRow
          key={index}
          item={label}
          isHighlighted={highlights.rhsLabels.includes(label)}
          showCategories={showCategories}
          onMouseEnter={() => handleMouseEnter(label)}
          onMouseLeave={handleMouseLeave}
          onDescriptionChange={(newDescription) => handleDescriptionChange(label, newDescription)}
          onClick={onLabelClick}
          direction="rhs"
          className="rhs-label"
          dataIndex={index}
        />
      ))}
    </div>
  ), [dataset.annotations.rhsLabels, highlights.rhsLabels, handleMouseEnter, handleMouseLeave, handleDescriptionChange, onLabelClick]);

  return (
    <div id="annotations" className={className}>
      {mappingsPanel}
      <div id="label-panels">
        {lhsLabelsPanel}
        {rhsLabelsPanel}
      </div>
    </div>
  );
}; 