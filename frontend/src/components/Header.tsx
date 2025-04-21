import React from 'react';

interface HeaderProps {
  onOpenChat: () => void;
  onShowComingSoon: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenChat, onShowComingSoon }) => {
  const handleGenerateAnnotations = () => {
    // TODO: Implement generateAnnotations function
  };

  return (
    <header>
      <div id="data-selector-container">
        <label htmlFor="data-selector"><i className="fas fa-arrow-up-from-bracket"></i>Load Documentation:</label>
        <select id="data-selector" className="with-label"></select>
      </div>
      <button onClick={onShowComingSoon}><i className="fas fa-scissors"></i>Slice Documentation</button>
      <button onClick={onShowComingSoon}><i className="fas fa-atom"></i>Autoformalize</button>
      <button onClick={handleGenerateAnnotations}><i className="fas fa-file-pen"></i>Generate Annotations</button>
      <button id="ai-assistant" onClick={onOpenChat}><i className="far fa-comments"></i>Chat with AI Assistant</button>
    </header>
  );
}; 
