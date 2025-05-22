import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { keyCodes } from '../utils/keyEventUtils.ts';

// Type definitions
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// Component
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === keyCodes.ESCAPE) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content ${className || ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}; 