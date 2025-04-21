import React from 'react';

interface HeaderProps {
  onShowComingSoon: () => void;
  onGenerateAnnotations: () => void;
  onOpenChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenChat, onShowComingSoon, onGenerateAnnotations }) => {
  return (
    <header>
      <div id="data-selector-container">
        <label htmlFor="data-selector"><i className="fas fa-arrow-up-from-bracket"></i>Load Documentation:</label>
        <select id="data-selector" className="with-label"></select>
      </div>
      <button onClick={onShowComingSoon}><i className="fas fa-scissors"></i>Slice Documentation</button>
      <button onClick={onShowComingSoon}><i className="fas fa-atom"></i>Autoformalize</button>
      <button onClick={onGenerateAnnotations}><i className="fas fa-file-pen"></i>Generate Annotations</button>
      <button id="ai-assistant" onClick={onOpenChat}><i className="far fa-comments"></i>Chat with AI Assistant</button>
    </header>
  );
}; 
