import { GetDatasetNamesResponse } from '@common/serverAPI/getDatasetNamesAPI.ts';
import { GetDatasetResponse } from '@common/serverAPI/getDatasetAPI.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse }
  from '@common/serverAPI/generateAnnotationsAPI.ts';
import { GenerateCategoryLabelsRequest, GenerateCategoryLabelsResponse }
  from '@common/serverAPI/generateCategoryLabelsAPI.ts';
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse }
  from '@common/serverAPI/chatAboutAnnotationsAPI.ts';
import { SaveDatasetRequest, SaveDatasetResponse }
  from '@common/serverAPI/saveDatasetAPI.ts';
import { ErrorResponse } from '@common/serverAPI/ErrorResponse.ts';
import { GetAllAgentPromptsResponse } from '@common/serverAPI/getAllAgentPromptsAPI.ts';
import { WriteAgentPromptOverrideRequest, WriteAgentPromptOverrideResponse } from '@common/serverAPI/writeAgentPromptOverrideAPI.ts';

export const SERVER_BASE_URL = "http://localhost:3001";

const httpClient = {
  get: async <R>(endpoint: string): Promise<R> => {
    const response = await fetch(`${SERVER_BASE_URL}${endpoint}`);
    if (!response.ok) {
      let error = 'API request failed';
      try {
        const errorData = await response.json() as ErrorResponse;
        error = errorData.error;
      } catch (e) {}
      throw new Error(error);
    }
    return response.json();
  },
  post: async <Q, R>(endpoint: string, data: Q): Promise<R> => {
    const response = await fetch(`${SERVER_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let error = 'API request failed';
      try {
        const errorData = await response.json() as ErrorResponse;
        error = errorData.error;
      } catch (e) {}
      throw new Error(error);
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as R;
    }
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

  generateCategoryLabels: (request: GenerateCategoryLabelsRequest) =>
    httpClient.post<GenerateCategoryLabelsRequest, GenerateCategoryLabelsResponse>('/generate-category-labels', request),

  chatAboutAnnotations: (request: ChatAboutAnnotationsRequest) =>
    httpClient.post<ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse>('/chat-with-assistant', request),

  saveDataset: (request: SaveDatasetRequest) =>
    httpClient.post<SaveDatasetRequest, SaveDatasetResponse>('/save-dataset', request),

  getAllAgentPrompts: () =>
    httpClient.get<GetAllAgentPromptsResponse>('/getAllAgentPrompts'),

  writeAgentPromptOverride: (request: WriteAgentPromptOverrideRequest) =>
    httpClient.post<WriteAgentPromptOverrideRequest, WriteAgentPromptOverrideResponse>('/writeAgentPromptOverride', request),
}; 