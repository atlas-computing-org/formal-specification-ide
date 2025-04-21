import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { TextPanel } from './TextPanel.tsx';
import { LeftTabMode, RightTabMode } from '../types/state.ts';

export const MainContent: React.FC = () => {
  const { state, updateTabState } = useAppContext();
  const { tabState } = state;

  const leftTabs: LeftTabMode[] = ['pdf', 'full-text', 'selected-text'];
  const rightTabs: RightTabMode[] = ['pre-written', 'generated'];

  const handleLeftTabChange = (tab: LeftTabMode) => {
    updateTabState({ ...tabState, left: tab });
  };

  const handleRightTabChange = (tab: RightTabMode) => {
    updateTabState({ ...tabState, right: tab });
  };

  return (
    <main>
      <div id="text-panels" className="highlight-all">
        <TextPanel
          side="left"
          title="Natural Language Documentation"
          tabs={leftTabs}
          activeTab={tabState.left}
          onTabChange={handleLeftTabChange}
        />
        <TextPanel
          side="right"
          title="Mechanized Spec"
          tabs={rightTabs}
          activeTab={tabState.right}
          onTabChange={handleRightTabChange}
        />
      </div>

      <div id="annotations">
        <div id="mappings-panel">
          <div className="header">Mappings</div>
        </div>
        <div id="label-panels">
          <div id="lhs-labels-panel">
            <div className="header">Left-Side Labels</div>
          </div>
          <div id="rhs-labels-panel">
            <div className="header">Right-Side Labels</div>
          </div>
        </div>
      </div>
    </main>
  );
}; 