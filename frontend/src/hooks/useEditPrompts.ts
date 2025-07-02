import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AgentPromptFile } from '@common/serverAPI/getAllAgentPromptsAPI.ts';

export const useEditPrompts = () => {
  // State
  const [prompts, setPrompts] = useState<AgentPromptFile[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [promptContent, setPromptContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  // Load prompts from API
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAllAgentPrompts();
      if ('data' in response) {
        const promptsData = response.data.prompts;
        setPrompts(promptsData);
        
        // Set initial prompt selection if we have prompts
        if (promptsData.length > 0) {
          const firstPrompt = promptsData[0];
          setSelectedPrompt(firstPrompt.fileName);
          setPromptContent(firstPrompt.fileContent);
          setOriginalContent(firstPrompt.fileContent);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a prompt
  const selectPrompt = useCallback((fileName: string) => {
    setSelectedPrompt(fileName);
    
    const prompt = prompts.find(p => p.fileName === fileName);
    if (prompt) {
      setPromptContent(prompt.fileContent);
      setOriginalContent(prompt.fileContent);
    }
  }, [prompts]);

  // Update prompt content
  const updateContent = useCallback((content: string) => {
    setPromptContent(content);
  }, []);

  // Save prompt override
  const savePrompt = useCallback(async () => {
    if (!selectedPrompt) return;
    
    try {
      setSaving(true);
      setError('');
      await api.writeAgentPromptOverride({
        fileName: selectedPrompt,
        fileContent: promptContent
      });
      
      // Update the prompts list with the new content
      setPrompts(prev => prev.map(p => 
        p.fileName === selectedPrompt 
          ? { ...p, fileContent: promptContent }
          : p
      ));
      setOriginalContent(promptContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }, [selectedPrompt, promptContent]);

  // Cancel changes
  const cancelChanges = useCallback(() => {
    setPromptContent(originalContent);
  }, [originalContent]);

  // Check if content has changed
  const hasChanges = promptContent !== originalContent;

  return {
    // State
    prompts,
    selectedPrompt,
    promptContent,
    loading,
    error,
    saving,
    hasChanges,
    
    // Actions
    loadPrompts,
    selectPrompt,
    updateContent,
    savePrompt,
    cancelChanges,
  };
}; 