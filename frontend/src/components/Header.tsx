import React from 'react';

// Type definitions
interface HeaderProps {
  datasetNames: string[];
  currentDatasetName: string;
  onDatasetChange: (name: string) => void;
  onShowComingSoon: () => void;
  onGenerateAnnotations: () => void;
  onShowChat: () => void;
}

// Component
export const Header: React.FC<HeaderProps> = ({
  datasetNames,
  currentDatasetName,
  onDatasetChange,
  onShowChat,
  onShowComingSoon,
  onGenerateAnnotations,
}) => {
  // Main render
  return (
    <header>
      <div id="data-selector-container">
        <label htmlFor="data-selector"><i className="fas fa-arrow-up-from-bracket"></i>Load Documentation:</label>
        <select 
          id="data-selector" 
          className="with-label"
          value={currentDatasetName}
          onChange={(e) => onDatasetChange(e.target.value)}
        >
          {datasetNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <button id="slice-text" onClick={onShowComingSoon}><i className="fas fa-scissors"></i>Slice Documentation</button>
      <button id="autoformalize" onClick={onShowComingSoon}><i className="fas fa-atom"></i>Autoformalize</button>
      <button id="generate-annotations" onClick={onGenerateAnnotations}><i className="fas fa-file-pen"></i>Generate Annotations</button>
      <button id="ai-assistant" onClick={onShowChat}><i className="far fa-comments"></i>Chat with AI Assistant</button>
    </header>
  );
}; 
