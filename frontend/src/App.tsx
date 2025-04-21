import React from 'react';
import { PanelHeader } from './components/PanelHeader/PanelHeader.tsx';
import { useDataset } from './hooks/useDataset.ts';

export const App: React.FC = () => {
  const { loading, error, loadDataset } = useDataset();

  React.useEffect(() => {
    loadDataset('default'); // Load default dataset on mount
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="app">
      <PanelHeader 
        title="Natural Language Documentation"
        tabs={["PDF", "Full Text", "Sliced Text"]}
        activeTab="PDF"
        onTabChange={(tab) => console.log('Tab changed:', tab)}
      />
    </div>
  );
}; 