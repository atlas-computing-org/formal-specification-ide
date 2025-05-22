import React, { useState } from 'react';

interface SaveAsDialogueProps {
  currentDatasetName: string;
  onSave: (datasetName: string, annotationsName: string) => void;
  onCancel: () => void;
  error?: string;
}

export const SaveAsDialogue: React.FC<SaveAsDialogueProps> = ({
  currentDatasetName,
  onSave,
  onCancel,
  error,
}) => {
  const [annotationsName, setAnnotationsName] = useState('annotations');

  const handleSave = () => {
    onSave(currentDatasetName, annotationsName);
  };

  return (
    <div className="save-as-form">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="annotations-name">Annotations Name:</label>
        <input
          id="annotations-name"
          type="text"
          value={annotationsName}
          onChange={(e) => setAnnotationsName(e.target.value)}
        />
      </div>
      <div className="button-group">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}; 