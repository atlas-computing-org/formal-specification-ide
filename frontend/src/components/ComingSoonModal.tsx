import React from 'react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="coming-soon-modal" className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content">
        <p>Coming soon...</p>
      </div>
    </div>
  );
}; 