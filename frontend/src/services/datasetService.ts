import { api } from './api.ts';
import { GetDatasetNamesResponse } from '@common/serverAPI/getDatasetNamesAPI.ts';
import { GetDatasetResponse } from '@common/serverAPI/getDatasetAPI.ts';

export const datasetService = {
  getDatasetNames: () => api.get<GetDatasetNamesResponse>('/getDatasetNames'),
  getDataset: (name: string) => api.get<GetDatasetResponse>(`/getDataset/${name}`),
}; 