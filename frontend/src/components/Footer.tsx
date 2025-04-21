import React from 'react';

interface FooterProps {
  onOpenDebug: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDebug }) => {
  return (
    <footer>
      <button id="highlight-all-annotations">Highlight All</button>
      <button id="hide-annotations-panel">Hide Annotations Panel</button>
      <button id="show-debug-info" onClick={onOpenDebug}>Show Debug Info</button>
      <div id="annotations-set-selector-container" className="hidden">
        <label htmlFor="annotations-set-selector">Annotations Set:</label>
        <select id="annotations-set-selector" className="with-label"></select>
      </div>
      <button id="use-demo-cache">Use Cached Responses</button>
    </footer>
  );
}; 