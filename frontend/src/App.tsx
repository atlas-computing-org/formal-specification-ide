import { AppProvider, useAppContext } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { ComingSoonModal } from './components/ComingSoonModal.tsx';
import { DebugModal } from './components/DebugModal.tsx';
import { useState } from 'react';
import { useDataset } from './hooks/useDataset.ts';

function AppContent() {
  const { state } = useAppContext();
  const { generateAnnotations } = useDataset();

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  const handleOpenComingSoon = () => { setIsComingSoonModalOpen(true); };
  const handleCloseComingSoon = () => { setIsComingSoonModalOpen(false); };

  const handleGenerateAnnotations = async () => { await generateAnnotations(state.useDemoCache); };

  const handleOpenChat = () => { setIsChatModalOpen(true); };
  const handleCloseChat = () => { setIsChatModalOpen(false); };

  const handleOpenDebug = () => { setIsDebugModalOpen(true); };
  const handleCloseDebug = () => { setIsDebugModalOpen(false); };

  return (
    <>
      <Header
        onShowComingSoon={handleOpenComingSoon}
        onGenerateAnnotations={handleGenerateAnnotations}
        onOpenChat={handleOpenChat} />
      <MainContent />
      <Footer onOpenDebug={handleOpenDebug} />
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