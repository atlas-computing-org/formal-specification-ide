import React from 'react';

interface PanelHeaderProps {
  title: string;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ 
  title, 
  tabs, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="panel-header">
      <div className="header">{title}</div>
      <div className="panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}; 