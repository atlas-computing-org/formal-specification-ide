import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatAssistant } from './components/ChatAssistant.tsx';
import { ComingSoon } from './components/ComingSoon.tsx';
import { DebugInfo } from './components/DebugInfo.tsx';
import { SaveAsDialogue } from './components/SaveAsDialogue.tsx';
import { Modal } from './components/Modal.tsx';
import { EditPrompts } from './components/EditPrompts.tsx';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDataset } from './hooks/useDataset.ts';
import { useDatasetNames } from './hooks/useDatasetNames.ts';
import { useAnnotationMode } from './hooks/useAnnotationMode.ts';
import { handleApplicationLevelHotkeys } from './utils/keyEventUtils.ts';
import { api } from './services/api.ts';
import { stripDatasetCache } from './utils/annotationCachingUtils.ts';
import { AnnotationsWithText } from '@common/annotations.ts';
import { generateAnnotationId } from './utils/annotationUtils.ts';

const DEFAULT_ANNOTATIONS_SET_NAME = 'annotations';

// Modal state enum
enum ModalState {
  CLOSED = 'CLOSED',
  DEBUG = 'DEBUG',
  CHAT = 'CHAT',
  COMING_SOON = 'COMING_SOON',
  SAVE_AS = 'SAVE_AS',
  EDIT_PROMPTS = 'EDIT_PROMPTS',
}

function AppContent() {
  const { state, updateDataset, updateHighlights } = useAppContext();
  const { datasetNames, loadDatasetNames, loading: _datasetNamesLoading } = useDatasetNames();
  const { generateAnnotations, generateCategoryLabels, useAnnotationsSet, loadDataset, loading: _datasetLoading } = useDataset();
  const {
    isAnnotationMode,
    selectedRanges,
    handleTextSelection,
    handleSetAnnotationMode,
    handleAddAnnotation,
    handleCancelAnnotation,
  } = useAnnotationMode();

  const [modalState, setModalState] = useState<ModalState>(ModalState.CLOSED);
  const [isHighlightsVisible, setIsHighlightsVisible] = useState(true);
  const [isAnnotationsPanelVisible, setIsAnnotationsPanelVisible] = useState(true);
  const [useCachedResponses, setUseCachedResponses] = useState(false);
  const [currentAnnotationSetName, setCurrentAnnotationSetName] = useState(DEFAULT_ANNOTATIONS_SET_NAME);
  const [currentDatasetName, setCurrentDatasetName] = useState('');
  const [saveError, setSaveError] = useState<string | undefined>();
  const [showCategories, setShowCategories] = useState(false);

  const handleDatasetChange = async (name: string) => {
    setCurrentDatasetName(name);
    await loadDataset(name);
  };

  const handleGenerateAnnotations = async () => { await generateAnnotations(useCachedResponses); };
  const handleGenerateCategoryLabels = async () => { await generateCategoryLabels(); };

  const handleCloseModal = () => { setModalState(ModalState.CLOSED); };
  const handleOpenComingSoonModal = () => { setModalState(ModalState.COMING_SOON); };
  const handleOpenChatModal = () => { setModalState(ModalState.CHAT); };
  const handleOpenDebugModal = () => { setModalState(ModalState.DEBUG); };
  const handleOpenEditPromptsModal = () => { setModalState(ModalState.EDIT_PROMPTS); };
  const handleOpenSaveAsModal = () => {
    setSaveError(undefined);
    setModalState(ModalState.SAVE_AS);
  };

  const handleToggleHighlights = () => {
    setIsHighlightsVisible(!isHighlightsVisible);
  };

  const handleToggleAnnotationsPanel = () => {
    setIsAnnotationsPanelVisible(!isAnnotationsPanelVisible);
  };

  const handleToggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const annotationSetNames = Object.keys(state.currentAnnotationSets).sort();

  const handleAnnotationSetChange = (name: string) => {
    setCurrentAnnotationSetName(name);
    useAnnotationsSet(name);
  };

  const handleToggleCachedResponses = () => {
    setUseCachedResponses(!useCachedResponses);
  };

  // Helper function to update annotation quality (set or clear)
  const setAnnotationQuality = useCallback((score: 1 | 2 | 3 | 4 | undefined) => {
    const { dataset, hoveredAnnotationId, highlights } = state;
    
    if (!hoveredAnnotationId) return;

    // Create a new annotations object with the updated quality
    const newAnnotations: AnnotationsWithText = {
      mappings: dataset.annotations.mappings.map(m => 
        generateAnnotationId(m) === hoveredAnnotationId ? { ...m, quality: score } : m
      ),
      lhsLabels: dataset.annotations.lhsLabels.map(l => 
        generateAnnotationId(l) === hoveredAnnotationId ? { ...l, quality: score } : l
      ),
      rhsLabels: dataset.annotations.rhsLabels.map(l => 
        generateAnnotationId(l) === hoveredAnnotationId ? { ...l, quality: score } : l
      ),
    };

    // Update the dataset with new annotations
    updateDataset({
      ...dataset,
      annotations: newAnnotations,
    });

    // TODO: A better approach would be to rewrite the highlights to use stable IDs
    // so that highlights can't get out of sync with annotations
    //
    // Also update highlights if the hovered annotation is in highlights
    const newHighlights: AnnotationsWithText = {
      mappings: highlights.mappings.map(m => 
        generateAnnotationId(m) === hoveredAnnotationId ? { ...m, quality: score } : m
      ),
      lhsLabels: highlights.lhsLabels.map(l => 
        generateAnnotationId(l) === hoveredAnnotationId ? { ...l, quality: score } : l
      ),
      rhsLabels: highlights.rhsLabels.map(l => 
        generateAnnotationId(l) === hoveredAnnotationId ? { ...l, quality: score } : l
      ),
    };

    updateHighlights(newHighlights);
  }, [state, updateDataset, updateHighlights]);

  const handleScoreAnnotation = useCallback((score: 1 | 2 | 3 | 4) => {
    setAnnotationQuality(score);
  }, [setAnnotationQuality]);

  const handleClearAnnotationScore = useCallback(() => {
    setAnnotationQuality(undefined);
  }, [setAnnotationQuality]);

  const handleSaveAs = async (datasetName: string, annotationsName: string) => {
    try {
      const dataset = stripDatasetCache(state.dataset);
      await api.saveDataset({
        dataset,
        datasetName,
        annotationsName,
      });
      handleCloseModal();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save annotations');
    }
  };

  const isModalOpen = useMemo(() => {
    return modalState !== ModalState.CLOSED;
  }, [modalState]);

  // Load dataset names and dataset on mount
  useEffect(() => {
    const loadDatasetNamesAndDataset = async () => {
      if (datasetNames.length === 0) {
        // Load dataset names on mount
        await loadDatasetNames();
      } else if (!currentDatasetName) {
        setCurrentDatasetName(datasetNames[0]);
        await loadDataset(datasetNames[0]);
      }
    };
    loadDatasetNamesAndDataset();
  }, [datasetNames, currentDatasetName]);

  // Handle application-level hotkeys
  useEffect(() => {
    const handleKeyDown = handleApplicationLevelHotkeys({
      onEnterAnnotationMode: () => handleSetAnnotationMode(true),
      onAddAnnotation: handleAddAnnotation,
      onCancelAnnotation: handleCancelAnnotation,
      onScoreAnnotation: handleScoreAnnotation,
      onClearAnnotationScore: handleClearAnnotationScore,
      isAnnotationMode,
      isModalOpen,
    });

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnnotationMode, isModalOpen, handleAddAnnotation, handleCancelAnnotation, handleSetAnnotationMode, handleScoreAnnotation, handleClearAnnotationScore]);

  // Render modal content based on state
  const renderModalContent = () => {
    switch (modalState) {
      case ModalState.CHAT:
        return <ChatAssistant />;
      case ModalState.DEBUG:
        return <DebugInfo />;
      case ModalState.COMING_SOON:
        return <ComingSoon />;
      case ModalState.SAVE_AS:
        return (
          <SaveAsDialogue
            currentDatasetName={currentDatasetName}
            onSave={handleSaveAs}
            onCancel={handleCloseModal}
            error={saveError}
          />
        );
      case ModalState.EDIT_PROMPTS:
        return <EditPrompts onClose={handleCloseModal} />;
      default:
        return null;
    }
  };

  // Get modal content class name based on state
  const getModalStateClassName = () => {
    switch (modalState) {
      case ModalState.CHAT:
        return 'chat-assistant';
      case ModalState.DEBUG:
        return 'debug-info';
      case ModalState.COMING_SOON:
        return 'coming-soon';
      case ModalState.SAVE_AS:
        return 'save-as';
      case ModalState.EDIT_PROMPTS:
        return 'edit-prompts';
      default:
        return '';
    }
  };

  return (
    <>
      <Header
        datasetNames={datasetNames}
        currentDatasetName={currentDatasetName}
        onDatasetChange={handleDatasetChange}
        onShowComingSoon={handleOpenComingSoonModal}
        onGenerateAnnotations={handleGenerateAnnotations}
        onGenerateCategoryLabels={handleGenerateCategoryLabels}
        onSetAnnotationMode={handleSetAnnotationMode}
        onShowChat={handleOpenChatModal}
        isAnnotationMode={isAnnotationMode}
      />
      <MainContent 
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        showCategories={showCategories}
        pdfSrc={state.pdfSrc}
        selectedRanges={selectedRanges}
        isAnnotationMode={isAnnotationMode}
        onTextSelection={handleTextSelection}
      />
      <Footer
        onToggleHighlights={handleToggleHighlights}
        onToggleAnnotationsPanel={handleToggleAnnotationsPanel}
        onOpenDebug={handleOpenDebugModal}
        onOpenEditPrompts={handleOpenEditPromptsModal}
        onToggleCachedResponses={handleToggleCachedResponses}
        onOpenSaveAs={handleOpenSaveAsModal}
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        useCachedResponses={useCachedResponses}
        currentAnnotationSetName={currentAnnotationSetName}
        annotationSetNames={annotationSetNames}
        onAnnotationSetChange={handleAnnotationSetChange}
        showCategories={showCategories}
        onToggleCategories={handleToggleCategories}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className={getModalStateClassName()}
      >
        {renderModalContent()}
      </Modal>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;