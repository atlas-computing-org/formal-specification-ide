import React, { useCallback } from 'react';

// Type definitions
interface HeaderProps {
  datasetNames: string[];
  currentDatasetName: string;
  onDatasetChange: (name: string) => void;
  onShowComingSoon: () => void;
  onGenerateAnnotations: () => void;
  onGenerateCategoryLabels: () => void;
  onShowChat: () => void;
  isAnnotationMode: boolean;
  onSetAnnotationMode: (isAnnotationMode: boolean) => void;
}

// Component
export const Header: React.FC<HeaderProps> = ({
  datasetNames,
  currentDatasetName,
  onDatasetChange,
  onShowComingSoon,
  onGenerateAnnotations,
  onGenerateCategoryLabels,
  onSetAnnotationMode,
  onShowChat,
  isAnnotationMode,
}) => {
  // Event handlers
  const handleDatasetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    // Blur the select element to prevent it from picking up hotkey keypresses
    e.target.blur();

    onDatasetChange(e.target.value);
  }, [onDatasetChange]);

  const handleToggleAnnotationMode = useCallback(() => {
    onSetAnnotationMode(!isAnnotationMode);
  }, [isAnnotationMode, onSetAnnotationMode]);

  // Main render
  return (
    <header>
      <div id="data-selector-container">
        <label htmlFor="data-selector"><i className="fas fa-arrow-up-from-bracket"></i>Load Documentation:</label>
        <select 
          id="data-selector" 
          className="with-label"
          value={currentDatasetName}
          onChange={handleDatasetChange}
        >
          {datasetNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <button id="slice-text" onClick={onShowComingSoon}><i className="fas fa-scissors"></i>Slice Documentation</button>
      <button id="autoformalize" onClick={onShowComingSoon}><i className="fas fa-atom"></i>Autoformalize</button>
      <button id="generate-annotations" onClick={onGenerateAnnotations}><i className="fas fa-file-pen"></i>Generate Annotations</button>
      <button id="generate-category-labels" onClick={onGenerateCategoryLabels}><i className="fas fa-tags"></i>Categorize</button>
      <button id="manually-annotate" onClick={handleToggleAnnotationMode}>
        <i className="fas fa-pencil"></i>{isAnnotationMode ? 'Cancel Annotation' : 'Annotate'}
      </button>
      <button id="ai-assistant" onClick={onShowChat}><i className="far fa-comments"></i>Chat with AI Assistant</button>
    </header>
  );
}; 
