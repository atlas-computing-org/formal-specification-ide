import React from 'react';

interface FooterProps {
  onToggleHighlights: () => void;
  onToggleAnnotationsPanel: () => void;
  onOpenDebug: () => void;
  onToggleCachedResponses: () => void;
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  useCachedResponses: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onToggleHighlights,
  onToggleAnnotationsPanel,
  onOpenDebug,
  onToggleCachedResponses,
  isHighlightsVisible,
  isAnnotationsPanelVisible,
  useCachedResponses,
}) => {
  return (
    <footer>
      <button id="highlight-all-annotations" onClick={onToggleHighlights}>
        {isHighlightsVisible ? "Hide Highlights" : "Highlight All"}
      </button>
      <button id="hide-annotations-panel" onClick={onToggleAnnotationsPanel}>
        {isAnnotationsPanelVisible ? "Hide Annotations Panel" : "Show Annotations Panel"}
      </button>
      <button id="show-debug-info" onClick={onOpenDebug}>Show Debug Info</button>
      <div id="annotations-set-selector-container" className="hidden">
        <label htmlFor="annotations-set-selector">Annotations Set:</label>
        <select id="annotations-set-selector" className="with-label"></select>
      </div>
      <button id="use-demo-cache" onClick={onToggleCachedResponses}>
        {useCachedResponses ? "Use Live Responses" : "Use Cached Responses"}
      </button>
    </footer>
  );
}; 