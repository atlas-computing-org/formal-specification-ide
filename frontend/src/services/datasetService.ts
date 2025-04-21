import { api } from './api.ts';
import { GetDatasetNamesResponse } from '@common/serverAPI/getDatasetNamesAPI.ts';
import { GetDatasetResponse } from '@common/serverAPI/getDatasetAPI.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse }
  from '@common/serverAPI/generateAnnotationsAPI.ts';
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse }
  from '@common/serverAPI/chatAboutAnnotationsAPI.ts';

export const datasetService = {
  getDatasetNames: () =>
    api.get<GetDatasetNamesResponse>('/getDatasetNames'),

  getDataset: (name: string) =>
    api.get<GetDatasetResponse>(`/getDataset/${name}`),

  generateAnnotations: (request: GenerateAnnotationsRequest) => 
    api.post<GenerateAnnotationsRequest, GenerateAnnotationsResponse>('/generate-annotations', request),

  chatAboutAnnotations: (request: ChatAboutAnnotationsRequest) =>
    api.post<ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse>('/chat-with-assistant', request),
}; 