import { useState } from 'react';
import { datasetService } from '../services/datasetService.ts';

interface DatasetState {
  lhsText: string;
  rhsText: string;
  annotations: any; // TODO: Define proper type
  fullText: string;
  pdfUrl: string;
}

const EMPTY_DATASET: DatasetState = {
  lhsText: '',
  rhsText: '',
  annotations: {},
  fullText: '',
  pdfUrl: ''
};

export const useDataset = () => {
  const [dataset, setDataset] = useState<DatasetState>(EMPTY_DATASET);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDataset = async (name: string) => {
    try {
      setLoading(true);
      const response = await datasetService.getDataset(name);
      if ("error" in response) {
        throw new Error(response.error);
      }
      setDataset(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { dataset, loading, error, loadDataset };
}; 