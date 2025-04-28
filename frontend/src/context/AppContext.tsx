import React, { createContext, useContext, useState } from 'react';
import { AnnotationSets, AnnotationsWithText, DatasetWithText } from '@common/annotations.ts';

interface AppState {
  dataset: DatasetWithText;
  highlights: AnnotationsWithText;
  pdfSrc: string;
  fullText: string;

  // Developer-only features
  currentAnnotationSets: AnnotationSets;

  // Debug info
  lastRawModelOutput: string;
  allRawModelOutputs: string[];
}

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

const initialState: AppState = {
  dataset: EMPTY_DATASET,
  highlights: EMPTY_ANNOTATIONS,
  currentAnnotationSets: {},
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
  updateAnnotationSets: (annotationSets: AnnotationSets) => void;
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

  const updateAnnotationSets = (annotationSets: AnnotationSets) => {
    updateState({ currentAnnotationSets: annotationSets });
  };

  return (
    <AppContext.Provider value={{
      state,
      updateState,
      updateDataset,
      updateHighlights,
      updateAnnotationSets,
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