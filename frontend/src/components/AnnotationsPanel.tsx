import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { AnnotationRow } from './AnnotationRow.tsx';
import { AnnotationsWithText, TextMappingWithText, TextLabelWithText } from '@common/annotations.ts';

export const AnnotationsPanel: React.FC = () => {
  const { state, updateDataset, updateHighlights } = useAppContext();
  const { dataset, highlights } = state;

  const handleDescriptionChange = (item: TextMappingWithText | TextLabelWithText, newDescription: string) => {
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
  };

  const handleMouseEnter = (item: TextMappingWithText | TextLabelWithText) => {
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
  };

  const handleMouseLeave = () => {
    updateHighlights({
      mappings: [],
      lhsLabels: [],
      rhsLabels: [],
    });
  };

  return (
    <div id="annotations">
      <div id="mappings-panel">
        <div className="header">Mappings</div>
        {dataset.annotations.mappings.map((mapping, index) => (
          <AnnotationRow
            key={index}
            item={mapping}
            isHighlighted={highlights.mappings.includes(mapping)}
            onMouseEnter={() => handleMouseEnter(mapping)}
            onMouseLeave={handleMouseLeave}
            onDescriptionChange={(newDescription) => handleDescriptionChange(mapping, newDescription)}
          />
        ))}
      </div>
      <div id="label-panels">
        <div id="lhs-labels-panel">
          <div className="header">Left-Side Labels</div>
          {dataset.annotations.lhsLabels.map((label, index) => (
            <AnnotationRow
              key={index}
              item={label}
              isHighlighted={highlights.lhsLabels.includes(label)}
              onMouseEnter={() => handleMouseEnter(label)}
              onMouseLeave={handleMouseLeave}
              onDescriptionChange={(newDescription) => handleDescriptionChange(label, newDescription)}
            />
          ))}
        </div>
        <div id="rhs-labels-panel">
          <div className="header">Right-Side Labels</div>
          {dataset.annotations.rhsLabels.map((label, index) => (
            <AnnotationRow
              key={index}
              item={label}
              isHighlighted={highlights.rhsLabels.includes(label)}
              onMouseEnter={() => handleMouseEnter(label)}
              onMouseLeave={handleMouseLeave}
              onDescriptionChange={(newDescription) => handleDescriptionChange(label, newDescription)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 