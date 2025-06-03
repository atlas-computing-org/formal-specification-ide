import React, { useCallback, useMemo } from 'react';
import { Direction, AnnotationsWithText, TextRangeWithText, TextRange } from '@common/annotations.ts';
import { useAppContext } from '../context/AppContext.tsx';
import { useAnnotationLookup } from '../hooks/useAnnotationLookup.ts';
import { useTextPartitioning } from '../hooks/useTextPartitioning.ts';
import { TextSegment } from './TextSegment.tsx';
import { AnnotationsSlice, TextMappingSlice, AnnotationsSliceWrapped } from '../utils/AnnotationsSlice.ts';

// Helper functions
function getInnermostMappingAtIndex(annotations: AnnotationsSlice, index: number): TextMappingSlice | undefined {
  let selectedMapping = undefined as TextMappingSlice | undefined;
  let minLength = Infinity;
  annotations.mappings.forEach(mapping => {
    mapping.ranges.forEach((range: {start: number, end: number}) => {
      if (range.start <= index && index < range.end) {
        const length = range.end - range.start;
        if (length < minLength) {
          minLength = length;
          selectedMapping = mapping;
        }
      }
    });
  });
  return selectedMapping;
}

function getMatchingRangesForIndex(ranges: TextRangeWithText[], index: number): TextRangeWithText[] {
  return ranges.filter(range => range.start <= index && index < range.end);
}

function isInnerMostRange(targetRanges: TextRangeWithText[], index: number, matchingRanges: TextRangeWithText[]): boolean {
  const rangesAreIdentical = (a: TextRangeWithText, b: TextRangeWithText): boolean =>
    a.start === b.start && a.end === b.end;
  const rangeIsStrictSuperset = (a: TextRangeWithText, b: TextRangeWithText): boolean =>
    a.start <= b.start && b.end <= a.end && !rangesAreIdentical(a, b);

  // A range is inner-most if it is not a strict superset of any other matching range
  return targetRanges
    .filter(range => range.start <= index && index < range.end) // performance optimization: filter by index first
    .filter(range => !matchingRanges.some(other => rangeIsStrictSuperset(range, other)))
    .length > 0;
}

// Filter to the inner-most annotations at the given index
function filterAnnotationsForIndex(annotations: AnnotationsWithText, index: number, direction: Direction): AnnotationsWithText {
  const matchingMappingRanges = annotations.mappings.flatMap(
    mapping => getMatchingRangesForIndex(mapping[`${direction}Ranges`], index));
  const innerMatchingMappings = annotations.mappings.filter(
    mapping => isInnerMostRange(mapping[`${direction}Ranges`], index, matchingMappingRanges));

  const matchingLabelRanges = annotations[`${direction}Labels`].flatMap(
    label => getMatchingRangesForIndex(label.ranges, index));
  const innerMatchingLabels = annotations[`${direction}Labels`].filter(
    label => isInnerMostRange(label.ranges, index, matchingLabelRanges));

  return {
    mappings: innerMatchingMappings,
    lhsLabels: direction === "lhs" ? innerMatchingLabels : [],
    rhsLabels: direction === "rhs" ? innerMatchingLabels : [],
  };
}

// Type definitions
export type LeftTabMode = 'pdf' | 'full-text' | 'selected-text';
export type RightTabMode = 'pre-written' | 'generated';

interface TextPanelPropsBase<T extends LeftTabMode | RightTabMode> {
  side: 'left' | 'right';
  title: string;
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  contentRef: React.RefObject<HTMLDivElement>;
  onClickTextMapping: (mapping: TextMappingSlice) => void;
  isAnnotationMode: boolean;
  onTextSelection: (direction: Direction, range: TextRange) => void;
  selectedRanges: TextRangeWithText[];
  showCategories: boolean;
  style?: React.CSSProperties;
  className?: string;
}

interface LeftTextPanelProps extends TextPanelPropsBase<LeftTabMode> {
  side: 'left';
  pdfSrc: string;
}

interface RightTextPanelProps extends TextPanelPropsBase<RightTabMode> {
  side: 'right';
}

function isLeftTextPanelProps(props: TextPanelProps): props is LeftTextPanelProps {
  return props.side === 'left';
}

type TextPanelProps = LeftTextPanelProps | RightTextPanelProps;

// Component
export const TextPanel: React.FC<TextPanelProps> = (props) => {
  // State and hooks
  const { state, updateHighlights } = useAppContext();
  const { dataset, highlights } = state;
  const isLeftPanel = isLeftTextPanelProps(props);
  const { contentRef, onClickTextMapping, isAnnotationMode, onTextSelection, selectedRanges, showCategories } = props;

  const useAnnotationsSlice = useCallback((annotations: AnnotationsWithText, direction: Direction): AnnotationsSlice => {
    return new AnnotationsSliceWrapped(annotations, direction);
  }, []);

  const direction: Direction = isLeftPanel ? 'lhs' : 'rhs';
  const text = isLeftPanel ? dataset.lhsText : dataset.rhsText;
  const annotations = useAnnotationsSlice(dataset.annotations, direction);
  const highlightsSlice = useAnnotationsSlice(highlights, direction);
  const annotationLookup = useAnnotationLookup(annotations);
  const highlightsLookup = useAnnotationLookup(highlightsSlice);
  const textPartitioning = useTextPartitioning(text, annotations, selectedRanges);

  // Event handlers
  const handleMouseEnter = useCallback((index: number) => {
    const filteredAnnotations = filterAnnotationsForIndex(dataset.annotations, index, direction);
    updateHighlights(filteredAnnotations);
  }, [dataset.annotations, direction, updateHighlights]);

  const handleMouseLeave = useCallback(() => {
    updateHighlights({
      mappings: [],
      lhsLabels: [],
      rhsLabels: [],
    });
  }, [updateHighlights]);

  const getFullTextOffset = useCallback((container: Node, offset: number) => {
    const containerStartIndex = parseInt(container.parentElement?.getAttribute('data-start-index') || '0');
    return containerStartIndex + offset;
  }, []);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (isAnnotationMode) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const range = selection.getRangeAt(0);
      const startIndex = getFullTextOffset(range.startContainer, range.startOffset);
      const endIndex = getFullTextOffset(range.endContainer, range.endOffset);

      const newRange: TextRange = {
        start: startIndex,
        end: endIndex
      };

      onTextSelection(direction, newRange);

      // Clear the browser's text selection
      selection.removeAllRanges();
    }
  }, [isAnnotationMode, onTextSelection, direction, getFullTextOffset]);

  const handleClick = useCallback((index: number) => {
    // Don't treat text selection as a click
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }

    const annotationsAtIndex = annotationLookup.getAnnotationsForIndex(index);
    const selectedMapping = getInnermostMappingAtIndex(annotationsAtIndex, index);
    if (selectedMapping) {
      onClickTextMapping(selectedMapping);
    }
  }, [annotationLookup, onClickTextMapping]);

  // Render functions
  const renderContent = useMemo(() => {
    if (isLeftPanel) {
      switch (props.activeTab) {
        case 'pdf':
          return (
            <iframe
              id="pdf-frame"
              src={props.pdfSrc}
              width="100%"
              height="100%"
            />
          );
        case 'full-text':
          // TODO: Support annotations against the full-text document
          return <div className="text-panel-content" ref={contentRef}>{state.fullText}</div>;
        case 'selected-text':
          return (
            <div 
              className="text-panel-content" 
              ref={contentRef}
              onMouseUp={handleMouseUp}
            >
              {textPartitioning.getPartitions().map((partition, index) => (
                <TextSegment
                  key={index}
                  startIndex={partition.start}
                  text={partition.text}
                  annotations={annotationLookup.getAnnotationsForIndex(partition.start)}
                  highlights={highlightsLookup.getAnnotationsForIndex(partition.start)}
                  selectedRanges={selectedRanges}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  showCategories={showCategories}
                />
              ))}
            </div>
          );
        default:
          return null;
      }
    } else {
      switch (props.activeTab) {
        case 'pre-written':
          return (
            <div 
              className="text-panel-content" 
              ref={contentRef}
              onMouseUp={handleMouseUp}
            >
              {textPartitioning.getPartitions().map((partition, index) => (
                <TextSegment
                  key={index}
                  startIndex={partition.start}
                  text={partition.text}
                  annotations={annotationLookup.getAnnotationsForIndex(partition.start)}
                  highlights={highlightsLookup.getAnnotationsForIndex(partition.start)}
                  selectedRanges={selectedRanges}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  showCategories={showCategories}
                />
              ))}
            </div>
          );
        case 'generated':
          // TODO: Support generated mode
          return <div className="text-panel-content" ref={contentRef}></div>;
        default:
          return null;
      }
    }
  }, [
    isLeftPanel,
    props.activeTab,
    contentRef,
    state.fullText,
    textPartitioning,
    annotationLookup,
    highlightsLookup,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseUp,
    handleClick,
    selectedRanges,
    showCategories
  ]);

  const renderTabButton = useCallback((tab: LeftTabMode | RightTabMode) => {
    const handleTabClick = isLeftPanel ?
      () => props.onTabChange(tab as LeftTabMode) :
      () => props.onTabChange(tab as RightTabMode);
    return (
      <button
        key={tab}
        id={`tab-${tab}`}
        className={props.activeTab === tab ? 'active' : ''}
        onClick={handleTabClick}
      >
        {tab === 'pdf' ? 'PDF' :
         tab === 'full-text' ? 'Full Text' :
         tab === 'selected-text' ? 'Sliced Text' :
         tab === 'pre-written' ? 'Pre-Written Spec' :
         tab === 'generated' ? 'Generated Spec' : tab}
      </button>
    );
  }, [isLeftPanel, props.activeTab, props.onTabChange]);

  // Main render
  return (
    <div 
      id={isLeftPanel ? 'left-text' : 'right-text'} 
      className={`text-panel ${props.className || ''}`}
      style={props.style}
    >
      <div className="panel-header">
        <div className="header">{props.title}:</div>
        <div className="panel-tabs">
          {props.tabs.map(renderTabButton)}
        </div>
      </div>
      {renderContent}
    </div>
  );
};