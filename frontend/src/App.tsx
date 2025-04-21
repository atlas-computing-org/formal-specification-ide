import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MainContent } from './components/MainContent.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { ComingSoonModal } from './components/ComingSoonModal.tsx';
import { DebugModal } from './components/DebugModal.tsx';

function App() {
  return (
    <>
      <Header />
      <MainContent />
      <Footer />
      <ChatModal />
      <ComingSoonModal />
      <DebugModal />
    </>
  );
}

export default App; 