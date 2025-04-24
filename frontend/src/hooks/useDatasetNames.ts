import { useState, useEffect } from 'react';
import { api } from '../services/api.ts';

export const useDatasetNames = () => {
  const [datasetNames, setDatasetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDatasetNames = async () => {
    try {
      setLoading(true);
      const response = await api.getDatasetNames();
      if ("error" in response) {
        throw new Error(response.error);
      }
      setDatasetNames(response.data.datasetNames);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetNames();
  }, []);

  return { datasetNames, loading, error, loadDatasetNames };
}; 