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

  const handleOpenChat = () => {
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
  };

  return (
    <AppProvider>
      <Header onOpenChat={handleOpenChat} />
      <MainContent />
      <Footer />
      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} />
      <ComingSoonModal />
      <DebugModal />
    </AppProvider>
  );
}

export default App; 