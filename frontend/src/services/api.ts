import { GetDatasetNamesResponse } from '@common/serverAPI/getDatasetNamesAPI.ts';
import { GetDatasetResponse } from '@common/serverAPI/getDatasetAPI.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse }
  from '@common/serverAPI/generateAnnotationsAPI.ts';
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse }
  from '@common/serverAPI/chatAboutAnnotationsAPI.ts';

const API_BASE_URL = "http://localhost:3001";

const httpClient = {
  get: async <R>(endpoint: string): Promise<R> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
  post: async <Q, R>(endpoint: string, data: Q): Promise<R> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
};

export const api = {
  getDatasetNames: () =>
    httpClient.get<GetDatasetNamesResponse>('/getDatasetNames'),

  getDataset: (name: string) =>
    httpClient.get<GetDatasetResponse>(`/getDataset/${name}`),

  generateAnnotations: (request: GenerateAnnotationsRequest) => 
    httpClient.post<GenerateAnnotationsRequest, GenerateAnnotationsResponse>('/generate-annotations', request),

  chatAboutAnnotations: (request: ChatAboutAnnotationsRequest) =>
    httpClient.post<ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse>('/chat-with-assistant', request),
}; 