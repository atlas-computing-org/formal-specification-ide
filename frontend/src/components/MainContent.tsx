import React, { useState, useRef, useCallback, useMemo } from 'react';
import { TextPanel, LeftTabMode, RightTabMode } from './TextPanel.tsx';
import { AnnotationsPanel } from './AnnotationsPanel.tsx';
import { scrollToTextRange } from '../utils/textPanelScrollManager.ts';
import { TextMappingSlice } from '../utils/AnnotationsSlice.ts';
import { useAppContext } from '../context/AppContext.tsx';
import { getMatchingMappingInOppositeText } from '../utils/annotationMatcher.ts';
import { Direction } from '@common/annotations.ts';

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
export const MainContent: React.FC<MainContentProps> = (props) => {
  const { state } = useAppContext();
  const { dataset } = state;

  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const [leftTabMode, setLeftTabMode] = useState<LeftTabMode>(INITIAL_LEFT_TAB_STATE);
  const [rightTabMode, setRightTabMode] = useState<RightTabMode>(INITIAL_RIGHT_TAB_STATE);

  const handleTextMappingClick = useCallback((sourceMapping: TextMappingSlice, sourceDirection: Direction, contentRef: React.RefObject<HTMLDivElement>) => {
    const targetMapping = getMatchingMappingInOppositeText(dataset.annotations, sourceMapping, sourceDirection);
    if (targetMapping?.ranges.length) {
      const targetRange = targetMapping.ranges.reduce((prev, curr) => 
        curr.start < prev.start ? curr : prev
      );
      if (contentRef.current) {
        scrollToTextRange(targetRange, contentRef.current);
      }
    }
  }, [dataset.annotations]);

  const handleLeftTextMappingClick = useCallback((mapping: TextMappingSlice) => {
    handleTextMappingClick(mapping, "lhs", rightContentRef);
  }, [handleTextMappingClick]);

  const handleRightTextMappingClick = useCallback((mapping: TextMappingSlice) => {
    handleTextMappingClick(mapping, "rhs", leftContentRef);
  }, [handleTextMappingClick]);

  // Derived values
  const leftTabs = useMemo(() => ['pdf', 'full-text', 'selected-text'] as LeftTabMode[], []);
  const rightTabs = useMemo(() => ['pre-written', 'generated'] as RightTabMode[], []);

  // Main render
  return (
    <main>
      <div id="text-panels" className={props.isHighlightsVisible ? 'highlight-all' : ''}>
        <TextPanel
          side="left"
          title="Natural Language Documentation"
          tabs={leftTabs}
          activeTab={leftTabMode}
          onTabChange={setLeftTabMode}
          pdfSrc={props.pdfSrc}
          contentRef={leftContentRef}
          onClickTextMapping={handleLeftTextMappingClick}
        />
        <TextPanel
          side="right"
          title="Mechanized Spec"
          tabs={rightTabs}
          activeTab={rightTabMode}
          onTabChange={setRightTabMode}
          contentRef={rightContentRef}
          onClickTextMapping={handleRightTextMappingClick}
        />
      </div>

      {props.isAnnotationsPanelVisible && <AnnotationsPanel />}
    </main>
  );
};