import React from 'react';
import { CategoryType, AnnotationsWithText } from '@common/annotations.ts';

interface CategoryLegendProps {
  className?: string;
  highlights?: AnnotationsWithText;
}

// Component
export const CategoryLegend: React.FC<CategoryLegendProps> = ({ className = '', highlights }) => {
  // All category types from the common annotations
  const categories: CategoryType[] = [
    'Preamble',
    'Navigation', 
    'Algorithm',
    'Parameter',
    'Definition',
    'Elaboration',
    'Diagram',
    'Intent',
    'Pre-condition',
    'Post-condition',
    'Preference',
    'Example'
  ];

  // Extract category types from highlighted annotations
  const highlightedCategories = React.useMemo(() => {
    if (!highlights) return new Set<CategoryType>();
    
    const categorySet = new Set<CategoryType>();
    
    // Check lhs labels
    highlights.lhsLabels.forEach(label => {
      if (label.category) {
        categorySet.add(label.category);
      }
    });
    
    // Check rhs labels
    highlights.rhsLabels.forEach(label => {
      if (label.category) {
        categorySet.add(label.category);
      }
    });
    
    return categorySet;
  }, [highlights]);

  return (
    <div className={`category-legend ${className}`}>
      <div className="legend-header">Category Legend</div>
      <div className="legend-items">
        {categories.map((category) => {
          const isHighlighted = highlightedCategories.has(category);
          return (
            <div 
              key={category} 
              className={`legend-item category-${category.toLowerCase()} ${isHighlighted ? 'highlighted' : ''}`}
            >
              <span className="legend-color"></span>
              <span className={`legend-label ${isHighlighted ? 'bold' : ''}`}>{category}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 