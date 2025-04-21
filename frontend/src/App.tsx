import { AppProvider } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { ComingSoonModal } from './components/ComingSoonModal.tsx';
import { DebugModal } from './components/DebugModal.tsx';
import { useState } from 'react';

function App() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
  };

  const handleOpenDebug = () => {
    setIsDebugModalOpen(true);
  };

  const handleCloseDebug = () => {
    setIsDebugModalOpen(false);
  };

  const handleOpenComingSoon = () => {
    setIsComingSoonModalOpen(true);
  };

  const handleCloseComingSoon = () => {
    setIsComingSoonModalOpen(false);
  };

  return (
    <AppProvider>
      <Header onOpenChat={handleOpenChat} onShowComingSoon={handleOpenComingSoon} />
      <MainContent />
      <Footer onOpenDebug={handleOpenDebug} />
      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} />
      <ComingSoonModal isOpen={isComingSoonModalOpen} onClose={handleCloseComingSoon} />
      <DebugModal isOpen={isDebugModalOpen} onClose={handleCloseDebug} />
    </AppProvider>
  );
}

export default App; 