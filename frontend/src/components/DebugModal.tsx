import React from 'react';

export const DebugModal: React.FC = () => {
  return (
    <div id="debug-info-modal" className="modal">
      <div className="modal-content">
        <span id="close-debug-modal" className="close-btn">&times;</span>
        <div>
          <label htmlFor="debug-selector">Debug Info:</label>
          <select id="debug-selector" className="with-label">
            <option value="last" selected>Last Raw Model Output</option>
            <option value="all">All Raw Model Outputs</option>
            <option value="annotations">Current Annotations (JSON)</option>
          </select>
        </div>
        <div id="debug-info-content"></div>
      </div>
    </div>
  );
}; 