import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer>
      <button id="highlight-all-annotations">Highlight All</button>
      <button id="hide-annotations-panel">Hide Annotations Panel</button>
      <button id="show-debug-info">Show Debug Info</button>
      <div id="annotations-set-selector-container" className="hidden">
        <label htmlFor="annotations-set-selector">Annotations Set:</label>
        <select id="annotations-set-selector" className="with-label"></select>
      </div>
      <button id="use-demo-cache">Use Cached Responses</button>
    </footer>
  );
}; 