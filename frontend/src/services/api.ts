const API_BASE_URL = "http://localhost:3001";

export const api = {
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