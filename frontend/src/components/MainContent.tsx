import React, { useState, useRef, useCallback, useMemo } from 'react';
import { TextPanel, LeftTabMode, RightTabMode } from './TextPanel.tsx';
import { AnnotationsPanel } from './AnnotationsPanel.tsx';
import { CategoryLegend } from './CategoryLegend.tsx';
import { PanelResizer } from './PanelResizer.tsx';
import { scrollToTextRange } from '../utils/textPanelScrollManager.ts';
import { TextMappingSlice } from '../utils/AnnotationsSlice.ts';
import { useAppContext } from '../context/AppContext.tsx';
import { getMatchingMappingInOppositeText } from '../utils/annotationMatcher.ts';
import { Direction, TextRangeWithText, TextRange } from '@common/annotations.ts';
import { MappingClickHandler, LabelClickHandler } from './AnnotationRow.tsx';

// Constants
const INITIAL_LEFT_TAB_STATE: LeftTabMode = 'selected-text';
const INITIAL_RIGHT_TAB_STATE: RightTabMode = 'pre-written';

// Type definitions
interface MainContentProps {
  isHighlightsVisible: boolean;
  isAnnotationsPanelVisible: boolean;
  showCategories: boolean;
  pdfSrc: string;
  selectedRanges: {lhs: TextRangeWithText[], rhs: TextRangeWithText[]};
  isAnnotationMode: boolean;
  onTextSelection: (direction: Direction, range: TextRange) => void;
}

// Component
export const MainContent: React.FC<MainContentProps> = (props) => {
  const { state } = useAppContext();
  const { dataset, highlights } = state;

  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const textPanelsRef = useRef<HTMLDivElement>(null);

  // State
  const [leftTabMode, setLeftTabMode] = useState<LeftTabMode>(INITIAL_LEFT_TAB_STATE);
  const [rightTabMode, setRightTabMode] = useState<RightTabMode>(INITIAL_RIGHT_TAB_STATE);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(50); // percentage

  const handleMappingClick: MappingClickHandler = useCallback(({ mapping, clickedRange }) => {
    if (clickedRange) {
      // If a specific range was clicked, scroll to that range
      const contentRef = clickedRange.direction === 'lhs' ? leftContentRef : rightContentRef;
      if (contentRef.current) {
        scrollToTextRange(clickedRange.range, contentRef.current);
      }
    } else {
      // If the row was clicked, scroll to the first range in each panel
      if (mapping.lhsRanges.length > 0 && leftContentRef.current) {
        scrollToTextRange(mapping.lhsRanges[0], leftContentRef.current);
      }
      if (mapping.rhsRanges.length > 0 && rightContentRef.current) {
        scrollToTextRange(mapping.rhsRanges[0], rightContentRef.current);
      }
    }
  }, []);

  const handleLabelClick: LabelClickHandler = useCallback(({ label, clickedRange, direction }) => {
    const contentRef = direction === 'lhs' ? leftContentRef : rightContentRef;
    if (contentRef.current) {
      const rangeToScroll = clickedRange || label.ranges[0];
      if (rangeToScroll) {
        scrollToTextRange(rangeToScroll, contentRef.current);
      }
    }
  }, []);

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

  const handlePanelResize = useCallback((leftWidth: number) => {
    if (!textPanelsRef.current) return;

    const containerWidth = textPanelsRef.current.offsetWidth;
    const leftPercentage = (leftWidth / containerWidth) * 100;
    setLeftPanelWidth(leftPercentage);
  }, []);

  // Derived values
  const leftTabs = useMemo(() => ['pdf', 'full-text', 'selected-text'] as LeftTabMode[], []);
  const rightTabs = useMemo(() => ['pre-written', 'generated'] as RightTabMode[], []);

  // Main render
  return (
    <main>
      <div id="primary-content">
        <div
          id="text-panels"
          className={`${props.isHighlightsVisible ? 'highlight-all' : ''} ${props.showCategories ? 'show-categories' : ''}`}
          ref={textPanelsRef}
        >
          <TextPanel
            side="left"
            title="Natural Language Documentation"
            tabs={leftTabs}
            activeTab={leftTabMode}
            onTabChange={setLeftTabMode}
            pdfSrc={props.pdfSrc}
            contentRef={leftContentRef}
            onClickTextMapping={handleLeftTextMappingClick}
            isAnnotationMode={props.isAnnotationMode}
            onTextSelection={props.onTextSelection}
            selectedRanges={props.selectedRanges.lhs}
            showCategories={props.showCategories}
          />

          <PanelResizer
            onResize={handlePanelResize}
            containerRef={textPanelsRef}
          />

          <TextPanel
            side="right"
            title="Mechanized Spec"
            tabs={rightTabs}
            activeTab={rightTabMode}
            onTabChange={setRightTabMode}
            contentRef={rightContentRef}
            onClickTextMapping={handleRightTextMappingClick}
            isAnnotationMode={props.isAnnotationMode}
            onTextSelection={props.onTextSelection}
            selectedRanges={props.selectedRanges.rhs}
            showCategories={props.showCategories}
            style={{ width: `${100 - leftPanelWidth}%` }}
            className="resizable"
          />
        </div>
        {props.showCategories && <CategoryLegend highlights={highlights} />}
      </div>

      {props.isAnnotationsPanelVisible && (
        <AnnotationsPanel
          onMappingClick={handleMappingClick}
          onLabelClick={handleLabelClick}
          showCategories={props.showCategories}
        />
      )}
    </main>
  );
};