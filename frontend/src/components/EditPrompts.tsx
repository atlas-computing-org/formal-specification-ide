import React, { useCallback } from 'react';
import { useEditPrompts } from '../hooks/useEditPrompts.ts';

// Type definitions
interface EditPromptsProps {
  onClose: () => void;
}

// Component
export const EditPrompts: React.FC<EditPromptsProps> = ({ onClose: _onClose }) => {
  const {
    prompts,
    selectedPrompt,
    promptContent,
    loading,
    error,
    saving,
    hasChanges,
    selectPrompt,
    updateContent,
    savePrompt,
    cancelChanges,
  } = useEditPrompts();

  // Event handlers
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    selectPrompt(e.target.value);
  }, [selectPrompt]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
  }, [updateContent]);

  const handleSave = useCallback(async () => {
    await savePrompt();
  }, [savePrompt]);

  const handleCancel = useCallback(() => {
    cancelChanges();
  }, [cancelChanges]);

  if (loading) {
    return (
      <div className="edit-prompts-loading">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading prompts...</p>
      </div>
    );
  }

  return (
    <>
      <div id="edit-prompts-header">
        <h3>Edit Agent Prompts</h3>
        <label htmlFor="prompt-selector">Select Prompt:</label>
        <select
          id="prompt-selector"
          className="with-label"
          value={selectedPrompt}
          onChange={handlePromptChange}
        >
          {prompts.map(prompt => (
            <option key={prompt.fileName} value={prompt.fileName}>
              {prompt.fileName}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div id="edit-prompts-content">
        <textarea
          id="prompt-editor"
          value={promptContent}
          onChange={handleContentChange}
          placeholder="Enter prompt content..."
          rows={3}
        />
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleCancel}
          disabled={!hasChanges}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </>
  );
}; 