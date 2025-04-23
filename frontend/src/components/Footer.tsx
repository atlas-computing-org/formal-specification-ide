import React from 'react';

// Type definitions
interface FooterProps {
  onToggleHighlights: () => void;
  onToggleAnnotationsPanel: () => void;
  onOpenDebug: () => void;
  onToggleCachedResponses: () => void;
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  currentAnnotationSetName: string;
  annotationSetNames: string[];
  onAnnotationSetChange: (name: string) => void;
  useCachedResponses: boolean;
}

// Component
export const Footer: React.FC<FooterProps> = ({
  onToggleHighlights,
  onToggleAnnotationsPanel,
  onOpenDebug,
  onToggleCachedResponses,
  isHighlightsVisible,
  isAnnotationsPanelVisible,
  currentAnnotationSetName,
  annotationSetNames,
  onAnnotationSetChange,
  useCachedResponses,
}) => {
  // Event handlers
  const handleAnnotationSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onAnnotationSetChange(e.target.value);
  };

  // Derived values
  const hasMultipleSets = annotationSetNames.length > 1;

  // Main render
  return (
    <footer>
      <button id="highlight-all-annotations" onClick={onToggleHighlights}>
        {isHighlightsVisible ? "Hide Highlights" : "Highlight All"}
      </button>
      <button id="hide-annotations-panel" onClick={onToggleAnnotationsPanel}>
        {isAnnotationsPanelVisible ? "Hide Annotations Panel" : "Show Annotations Panel"}
      </button>
      <button id="show-debug-info" onClick={onOpenDebug}>Show Debug Info</button>
      <div id="annotations-set-selector-container" className={hasMultipleSets ? '' : 'hidden'}>
        <label htmlFor="annotations-set-selector">Annotations Set:</label>
        <select 
          id="annotations-set-selector" 
          className="with-label"
          value={currentAnnotationSetName}
          onChange={handleAnnotationSetChange}
        >
          {annotationSetNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <button id="use-demo-cache" onClick={onToggleCachedResponses}>
        {useCachedResponses ? "Use Live Responses" : "Use Cached Responses"}
      </button>
    </footer>
  );
}; 