import React from 'react';
import { CategoryType } from '@common/annotations.ts';

interface CategoryLegendProps {
  className?: string;
}

// Component
export const CategoryLegend: React.FC<CategoryLegendProps> = ({ className = '' }) => {
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

  return (
    <div className={`category-legend ${className}`}>
      <div className="legend-header">Category Legend</div>
      <div className="legend-items">
        {categories.map((category) => (
          <div 
            key={category} 
            className={`legend-item category-${category.toLowerCase()}`}
          >
            <span className="legend-color"></span>
            <span className="legend-label">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 