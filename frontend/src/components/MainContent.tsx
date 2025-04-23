import React, { useState, useRef } from 'react';
import { TextPanel } from './TextPanel.tsx';
import { LeftTabMode, RightTabMode } from '../types/state.ts';
import { AnnotationsPanel } from './AnnotationsPanel.tsx';

const INITIAL_LEFT_TAB_STATE: LeftTabMode = 'selected-text';
const INITIAL_RIGHT_TAB_STATE: RightTabMode = 'pre-written';

interface MainContentProps {
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  pdfSrc: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  isHighlightsVisible,
  isAnnotationsPanelVisible,
  pdfSrc
}) => {
  const [leftTab, setLeftTab] = useState<LeftTabMode>(INITIAL_LEFT_TAB_STATE);
  const [rightTab, setRightTab] = useState<RightTabMode>(INITIAL_RIGHT_TAB_STATE);
  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);

  const handleLeftTabChange = (tab: LeftTabMode) => { setLeftTab(tab); };
  const handleRightTabChange = (tab: RightTabMode) => { setRightTab(tab); };

  const leftTabs: LeftTabMode[] = ['pdf', 'full-text', 'selected-text'];
  const rightTabs: RightTabMode[] = ['pre-written', 'generated'];

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