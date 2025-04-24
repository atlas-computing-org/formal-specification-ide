import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { ComingSoonModal } from './components/ComingSoonModal.tsx';
import { DebugModal } from './components/DebugModal.tsx';
import { useState, useEffect } from 'react';
import { useDataset } from './hooks/useDataset.ts';
import { useDatasetNames } from './hooks/useDatasetNames.ts';

const DEFAULT_ANNOTATIONS_SET_NAME = 'annotations';

function AppContent() {
  const { state } = useAppContext();
  const { datasetNames, loadDatasetNames, loading: datasetNamesLoading } = useDatasetNames();
  const { generateAnnotations, useAnnotationsSet, loadDataset, loading: datasetLoading } = useDataset();

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [isHighlightsVisible, setIsHighlightsVisible] = useState(true);
  const [isAnnotationsPanelVisible, setIsAnnotationsPanelVisible] = useState(true);
  const [useCachedResponses, setUseCachedResponses] = useState(false);
  const [currentAnnotationSetName, setCurrentAnnotationSetName] = useState(DEFAULT_ANNOTATIONS_SET_NAME);
  const [currentDatasetName, setCurrentDatasetName] = useState('');

  useEffect(() => {
    const loadDatasetNamesAndDataset = async () => {
      if (datasetNames.length === 0) {
        await loadDatasetNames();
      } else if (!currentDatasetName) {
        setCurrentDatasetName(datasetNames[0]);
        await loadDataset(datasetNames[0]);
      }
    };
    loadDatasetNamesAndDataset();
  }, [datasetNames, currentDatasetName]);

  const handleDatasetChange = async (name: string) => {
    setCurrentDatasetName(name);
    await loadDataset(name);
  };

  const handleOpenComingSoon = () => { setIsComingSoonModalOpen(true); };
  const handleCloseComingSoon = () => { setIsComingSoonModalOpen(false); };

  const handleGenerateAnnotations = async () => { await generateAnnotations(useCachedResponses); };

  const handleOpenChat = () => { setIsChatModalOpen(true); };
  const handleCloseChat = () => { setIsChatModalOpen(false); };

  const handleOpenDebug = () => { setIsDebugModalOpen(true); };
  const handleCloseDebug = () => { setIsDebugModalOpen(false); };

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

  return (
    <>
      <Header
        datasetNames={datasetNames}
        currentDatasetName={currentDatasetName}
        onDatasetChange={handleDatasetChange}
        onShowComingSoon={handleOpenComingSoon}
        onGenerateAnnotations={handleGenerateAnnotations}
        onShowChat={handleOpenChat}
      />
      <MainContent 
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        pdfSrc={state.pdfSrc}
      />
      <Footer
        onToggleHighlights={handleToggleHighlights}
        onToggleAnnotationsPanel={handleToggleAnnotationsPanel}
        onOpenDebug={handleOpenDebug}
        onToggleCachedResponses={handleToggleCachedResponses}
        isHighlightsVisible={isHighlightsVisible}
        isAnnotationsPanelVisible={isAnnotationsPanelVisible}
        useCachedResponses={useCachedResponses}
        currentAnnotationSetName={currentAnnotationSetName}
        annotationSetNames={annotationSetNames}
        onAnnotationSetChange={handleAnnotationSetChange}
      />
      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} />
      <ComingSoonModal isOpen={isComingSoonModalOpen} onClose={handleCloseComingSoon} />
      <DebugModal isOpen={isDebugModalOpen} onClose={handleCloseDebug} />
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