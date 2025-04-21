import React from 'react';

export const MainContent: React.FC = () => {
  return (
    <main>
      <div id="text-panels" className="highlight-all">
        <div id="left-text" className="text-panel">
          <div className="panel-header">
            <div className="header">Natural Language Documentation:</div>
            <div className="panel-tabs">
              <button id="tab-pdf">PDF</button>
              <button id="tab-full-text">Full Text</button>
              <button id="tab-selected-text">Sliced Text</button>
            </div>
          </div>
          <div className="text-panel-content" id="lhs-text-content"></div>
        </div>
        <div id="right-text" className="text-panel">
          <div className="panel-header">
            <div className="header">Mechanized Spec:</div>
            <div className="panel-tabs">
              <button id="tab-pre-written">Pre-Written Spec</button>
              <button id="tab-generated">Generated Spec</button>
            </div>
          </div>
          <div className="text-panel-content" id="rhs-text-content"></div>
        </div>
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