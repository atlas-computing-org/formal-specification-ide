import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatAssistant } from './components/ChatAssistant.tsx';
import { ComingSoon } from './components/ComingSoon.tsx';
import { DebugInfo } from './components/DebugInfo.tsx';
import { SaveAsDialogue } from './components/SaveAsDialogue.tsx';
import { Modal } from './components/Modal.tsx';
import { useState, useEffect, useMemo } from 'react';
import { useDataset } from './hooks/useDataset.ts';
import { useDatasetNames } from './hooks/useDatasetNames.ts';
import { useAnnotationMode } from './hooks/useAnnotationMode.ts';
import { handleApplicationLevelHotkeys } from './utils/keyEventUtils.ts';
import { api } from './services/api.ts';
import { stripDatasetCache } from './utils/annotationCachingUtils.ts';

const DEFAULT_ANNOTATIONS_SET_NAME = 'annotations';

// Modal state enum
enum ModalState {
  CLOSED = 'CLOSED',
  DEBUG = 'DEBUG',
  CHAT = 'CHAT',
  COMING_SOON = 'COMING_SOON',
  SAVE_AS = 'SAVE_AS',
}

function AppContent() {
  const { state } = useAppContext();
  const { datasetNames, loadDatasetNames, loading: datasetNamesLoading } = useDatasetNames();
  const { generateAnnotations, useAnnotationsSet, loadDataset, loading: datasetLoading } = useDataset();
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

  const handleDatasetChange = async (name: string) => {
    setCurrentDatasetName(name);
    await loadDataset(name);
  };

  const handleGenerateAnnotations = async () => { await generateAnnotations(useCachedResponses); };

  const handleCloseModal = () => { setModalState(ModalState.CLOSED); };
  const handleOpenComingSoonModal = () => { setModalState(ModalState.COMING_SOON); };
  const handleOpenChatModal = () => { setModalState(ModalState.CHAT); };
  const handleOpenDebugModal = () => { setModalState(ModalState.DEBUG); };
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

  const annotationSetNames = Object.keys(state.currentAnnotationSets).sort();

  const handleAnnotationSetChange = (name: string) => {
    setCurrentAnnotationSetName(name);
    useAnnotationsSet(name);
  };

  const handleToggleCachedResponses = () => {
    setUseCachedResponses(!useCachedResponses);
  };

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
      isAnnotationMode,
      isModalOpen,
    });

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnnotationMode, isModalOpen, handleAddAnnotation, handleCancelAnnotation, handleSetAnnotationMode]);

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
        onSetAnnotationMode={handleSetAnnotationMode}
        onShowChat={handleOpenChatModal}
        isAnnotationMode={isAnnotationMode}
      />
      <MainContent 
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        pdfSrc={state.pdfSrc}
        selectedRanges={selectedRanges}
        isAnnotationMode={isAnnotationMode}
        onTextSelection={handleTextSelection}
      />
      <Footer
        onToggleHighlights={handleToggleHighlights}
        onToggleAnnotationsPanel={handleToggleAnnotationsPanel}
        onOpenDebug={handleOpenDebugModal}
        onToggleCachedResponses={handleToggleCachedResponses}
        onOpenSaveAs={handleOpenSaveAsModal}
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        useCachedResponses={useCachedResponses}
        currentAnnotationSetName={currentAnnotationSetName}
        annotationSetNames={annotationSetNames}
        onAnnotationSetChange={handleAnnotationSetChange}
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