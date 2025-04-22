import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { LeftTabMode, RightTabMode } from '../types/state.ts';
import { Direction } from '@common/annotations.ts';
import { TextSegment } from './TextSegment.tsx';
import { useAnnotationLookup } from '../hooks/useAnnotationLookup.js';
import { useAnnotationsScrollManager } from '../hooks/useAnnotationsScrollManager.js';
import { useTextPartitioning } from '../hooks/useTextPartitioning.js';
import { useAnnotationsSlice } from '../hooks/useAnnotationsSlice.js';

interface TextPanelPropsBase<T extends LeftTabMode | RightTabMode> {
  side: 'left' | 'right';
  title: string;
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

interface LeftTextPanelProps extends TextPanelPropsBase<LeftTabMode> {
  side: 'left';
}

interface RightTextPanelProps extends TextPanelPropsBase<RightTabMode> {
  side: 'right';
}

function isLeftTextPanelProps(props: TextPanelProps): props is LeftTextPanelProps {
  return props.side === 'left';
}

type TextPanelProps = LeftTextPanelProps | RightTextPanelProps;

export const TextPanel: React.FC<TextPanelProps> = (props) => {
  const { state } = useAppContext();
  const { dataset, highlights } = state;
  const isLeftPanel = isLeftTextPanelProps(props);
  const contentRef = useRef<HTMLDivElement>(null);

  const direction: Direction = isLeftPanel ? 'lhs' : 'rhs';
  const text = isLeftPanel ? dataset.lhsText : dataset.rhsText;
  const annotations = useAnnotationsSlice(dataset.annotations, direction);
  const highlightsSlice = useAnnotationsSlice(highlights, direction);
  const annotationLookup = useAnnotationLookup(annotations);
  const highlightsLookup = useAnnotationLookup(highlightsSlice);
  const textPartitioning = useTextPartitioning(text, annotations);
  const scrollManager = useAnnotationsScrollManager(annotations, contentRef);

  const handleMouseEnter = (index: number) => {
    const annotationsAtIndex = annotationLookup.getAnnotationsForIndex(index);
    const highlightsAtIndex = highlightsLookup.getAnnotationsForIndex(index);
    // TODO: Update highlights in AppContext
  };

  const handleMouseLeave = () => {
    // TODO: Clear highlights in AppContext
  };

  const handleClick = (index: number) => {
    const annotationsAtIndex = annotationLookup.getAnnotationsForIndex(index);
    const selectedMapping = annotationsAtIndex.mappings.find(mapping => 
      mapping.ranges.some(range => range.start <= index && index < range.end)
    );
    if (selectedMapping) {
      const targetMapping = scrollManager.getMatchingMappingInTarget(selectedMapping);
      if (targetMapping?.ranges.length) {
        const targetRange = targetMapping.ranges.reduce((prev, curr) => 
          curr.start < prev.start ? curr : prev
        );
        scrollManager.scrollTargetTextToRange(targetRange);
      }
    }
  };

  const renderContent = () => {
    if (isLeftPanel) {
      switch (props.activeTab) {
        case 'pdf':
          return (
            <iframe
              id="pdf-frame"
              src={state.pdfSrc}
              width="100%"
              height="100%"
            />
          );
        case 'full-text':
          return <div className="text-panel-content" ref={contentRef}>{state.fullText}</div>;
        case 'selected-text':
          return (
            <div className="text-panel-content" ref={contentRef}>
              {textPartitioning.getPartitions().map((partition, index) => (
                <TextSegment
                  key={index}
                  startIndex={partition.start}
                  text={partition.text}
                  annotations={annotationLookup.getAnnotationsForIndex(partition.start)}
                  highlights={highlightsLookup.getAnnotationsForIndex(partition.start)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
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
            <div className="text-panel-content" ref={contentRef}>
              {textPartitioning.getPartitions().map((partition, index) => (
                <TextSegment
                  key={index}
                  startIndex={partition.start}
                  text={partition.text}
                  annotations={annotationLookup.getAnnotationsForIndex(partition.start)}
                  highlights={highlightsLookup.getAnnotationsForIndex(partition.start)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                />
              ))}
            </div>
          );
        case 'generated':
          return <div className="text-panel-content">Generated content will appear here</div>;
        default:
          return null;
      }
    }
  };

  const renderTabButton = (tab: LeftTabMode | RightTabMode) => {
    const onClick = isLeftPanel ?
      () => props.onTabChange(tab as LeftTabMode) :
      () => props.onTabChange(tab as RightTabMode);
    return (
      <button
        key={tab}
        id={`tab-${tab}`}
        className={props.activeTab === tab ? 'active' : ''}
        onClick={onClick}
      >
        {tab}
      </button>
    );
  };

  return (
    <div id={isLeftPanel ? 'left-text' : 'right-text'} className="text-panel">
      <div className="panel-header">
        <div className="header">{props.title}:</div>
        <div className="panel-tabs">
          {props.tabs.map(renderTabButton)}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}; 