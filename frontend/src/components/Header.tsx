import React from 'react';

export const Header: React.FC = () => {
  return (
    <header>
      <div id="data-selector-container">
        <label htmlFor="data-selector"><i className="fas fa-arrow-up-from-bracket"></i>Load Documentation:</label>
        <select id="data-selector" className="with-label"></select>
      </div>
      <button id="slice-text"><i className="fas fa-scissors"></i>Slice Documentation</button>
      <button id="autoformalize"><i className="fas fa-atom"></i>Autoformalize</button>
      <button id="generate-annotations"><i className="fas fa-file-pen"></i>Generate Annotations</button>
      <button id="ai-assistant"><i className="far fa-comments"></i>Chat with AI Assistant</button>
    </header>
  );
}; 
