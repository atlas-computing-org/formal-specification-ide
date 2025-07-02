import React, { useCallback, useMemo } from 'react';

// Type definitions
interface FooterProps {
  onToggleHighlights: () => void;
  onToggleAnnotationsPanel: () => void;
  onOpenDebug: () => void;
  onOpenEditPrompts: () => void;
  onToggleCachedResponses: () => void;
  onOpenSaveAs: () => void;
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  currentAnnotationSetName: string;
  annotationSetNames: string[];
  onAnnotationSetChange: (name: string) => void;
  useCachedResponses: boolean;
  showCategories: boolean;
  onToggleCategories: () => void;
}

// Component
export const Footer: React.FC<FooterProps> = ({
  onToggleHighlights,
  onToggleAnnotationsPanel,
  onOpenDebug,
  onOpenEditPrompts,
  onToggleCachedResponses,
  onOpenSaveAs,
  isHighlightsVisible,
  isAnnotationsPanelVisible,
  currentAnnotationSetName,
  annotationSetNames,
  onAnnotationSetChange,
  useCachedResponses,
  showCategories,
  onToggleCategories,
}) => {
  // Event handlers
  const handleAnnotationSetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onAnnotationSetChange(e.target.value);
  }, [onAnnotationSetChange]);

  // Derived values
  const hasMultipleSets = useMemo(() => annotationSetNames.length > 1, [annotationSetNames]);

  // Main render
  return (
    <footer>
      <button id="highlight-all-annotations" onClick={onToggleHighlights}>
        {isHighlightsVisible ? "Hide Highlights" : "Highlight All"}
      </button>
      <button id="toggle-categories" onClick={onToggleCategories}>
        {showCategories ? "Hide Categories" : "Show Categories"}
      </button>
      <button id="hide-annotations-panel" onClick={onToggleAnnotationsPanel}>
        {isAnnotationsPanelVisible ? "Hide Annotations Panel" : "Show Annotations Panel"}
      </button>
      <button id="save-button" onClick={onOpenSaveAs}>Save</button>
      <button id="edit-prompts" onClick={onOpenEditPrompts}>Edit Prompts</button>
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