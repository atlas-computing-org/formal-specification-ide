import React, { createContext, useContext, useState } from 'react';
import { AppState, TabState } from '../types/state.ts';
import { AnnotationsWithText, DatasetWithText } from '@common/annotations.ts';

const EMPTY_ANNOTATIONS: AnnotationsWithText = {
  mappings: [],
  lhsLabels: [],
  rhsLabels: [],
};

const EMPTY_DATASET: DatasetWithText = {
  lhsText: '',
  rhsText: '',
  annotations: EMPTY_ANNOTATIONS,
};

const INITIAL_TAB_STATE: TabState = {
  left: 'selected-text',
  right: 'pre-written',
};

const DEFAULT_ANNOTATIONS_SET_NAME = 'annotations';

const initialState: AppState = {
  dataset: EMPTY_DATASET,
  highlights: EMPTY_ANNOTATIONS,
  tabState: INITIAL_TAB_STATE,
  isNewChat: true,
  useDemoCache: false,
  currentAnnotationSets: {},
  selectedAnnotationsSetName: DEFAULT_ANNOTATIONS_SET_NAME,
  lastRawModelOutput: '',
  allRawModelOutputs: [],
  pdfSrc: '',
  fullText: '',
};

interface AppContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  updateDataset: (dataset: DatasetWithText) => void;
  updateHighlights: (highlights: AnnotationsWithText) => void;
  updateTabState: (tabState: TabState) => void;
  updateSelectedAnnotationsSet: (name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const updateDataset = (dataset: DatasetWithText) => {
    updateState({ dataset });
  };

  const updateHighlights = (highlights: AnnotationsWithText) => {
    updateState({ highlights });
  };

  const updateTabState = (tabState: TabState) => {
    updateState({ tabState });
  };

  const updateSelectedAnnotationsSet = (name: string) => {
    const { lhsText, rhsText } = state.dataset;
    const rawAnnotations = state.currentAnnotationSets[name] || EMPTY_ANNOTATIONS;
    const rawDataset = { lhsText, rhsText, annotations: rawAnnotations };
    updateState({ 
      selectedAnnotationsSetName: name,
      dataset: rawDataset
    });
  };

  return (
    <AppContext.Provider value={{
      state,
      updateState,
      updateDataset,
      updateHighlights,
      updateTabState,
      updateSelectedAnnotationsSet,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 