import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { LeftTabMode, RightTabMode } from '../types/state.ts';

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
  const { dataset } = state;
  const isLeftPanel = isLeftTextPanelProps(props);

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
          return <div className="text-panel-content">{state.fullText}</div>;
        case 'selected-text':
          return <div className="text-panel-content">{dataset.lhsText}</div>;
        default:
          return null;
      }
    } else {
      switch (props.activeTab) {
        case 'pre-written':
          return <div className="text-panel-content">{dataset.rhsText}</div>;
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