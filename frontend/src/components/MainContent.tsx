import React, { useState, useRef, useCallback, useMemo } from 'react';
import { LeftTabMode, RightTabMode } from '../types/state.ts';
import { TextPanel } from './TextPanel.tsx';
import { AnnotationsPanel } from './AnnotationsPanel.tsx';

// Constants
const INITIAL_LEFT_TAB_STATE: LeftTabMode = 'selected-text';
const INITIAL_RIGHT_TAB_STATE: RightTabMode = 'pre-written';

// Type definitions
interface MainContentProps {
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  pdfSrc: string;
}

// Component
export const MainContent: React.FC<MainContentProps> = ({
  isHighlightsVisible,
  isAnnotationsPanelVisible,
  pdfSrc
}) => {
  // State and hooks
  const [leftTab, setLeftTab] = useState<LeftTabMode>(INITIAL_LEFT_TAB_STATE);
  const [rightTab, setRightTab] = useState<RightTabMode>(INITIAL_RIGHT_TAB_STATE);
  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);

  // Event handlers
  const handleLeftTabChange = useCallback((tab: LeftTabMode) => {
    setLeftTab(tab);
  }, []);

  const handleRightTabChange = useCallback((tab: RightTabMode) => {
    setRightTab(tab);
  }, []);

  // Derived values
  const leftTabs = useMemo(() => ['pdf', 'full-text', 'selected-text'] as LeftTabMode[], []);
  const rightTabs = useMemo(() => ['pre-written', 'generated'] as RightTabMode[], []);

  // Main render
  return (
    <main>
      <div id="text-panels" className={isHighlightsVisible ? 'highlight-all' : ''}>
        <TextPanel
          side="left"
          title="Natural Language Documentation"
          tabs={leftTabs}
          activeTab={leftTab}
          onTabChange={handleLeftTabChange}
          pdfSrc={pdfSrc}
          contentRef={leftContentRef}
          oppositeContentRef={rightContentRef}
        />
        <TextPanel
          side="right"
          title="Mechanized Spec"
          tabs={rightTabs}
          activeTab={rightTab}
          onTabChange={handleRightTabChange}
          contentRef={rightContentRef}
          oppositeContentRef={leftContentRef}
        />
      </div>

      <AnnotationsPanel className={isAnnotationsPanelVisible ? '' : 'hide'} />
    </main>
  );
};