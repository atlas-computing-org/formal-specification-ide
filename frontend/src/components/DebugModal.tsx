import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';

// Type definitions
interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component
export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  // State and hooks
  const { state } = useAppContext();
  const [selectedOption, setSelectedOption] = useState<'last' | 'all' | 'annotations'>('last');

  // Derived values
  const getDebugContent = () => {
    switch (selectedOption) {
      case 'last':
        return state.lastRawModelOutput;
      case 'all':
        return state.allRawModelOutputs
          .map((output, index) => `---- RAW MODEL OUTPUT: ${index + 1} ----\n\n${output}`)
          .join('\n\n\n\n\n\n');
      case 'annotations':
        return JSON.stringify(state.dataset.annotations, null, 2);
      default:
        return '';
    }
  };

  // Main render
  return (
    <div id="debug-info-modal" className={`modal ${isOpen ? 'show' : ''}`}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div>
          <label htmlFor="debug-selector">Debug Info:</label>
          <select
            id="debug-selector"
            className="with-label"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value as 'last' | 'all' | 'annotations')}
          >
            <option value="last">Last Raw Model Output</option>
            <option value="all">All Raw Model Outputs</option>
            <option value="annotations">Current Annotations (JSON)</option>
          </select>
        </div>
        <div id="debug-info-content" className={selectedOption === 'annotations' ? 'json' : ''}>
          {getDebugContent()}
        </div>
      </div>
    </div>
  );
}; 