import React from 'react';

// Type definitions
interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component
export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose }) => {
  // Main render
  return (
    <div id="coming-soon-modal" className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content">
        <p>Coming soon...</p>
      </div>
    </div>
  );
}; 