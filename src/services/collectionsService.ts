import apiClient from './apiClient';

export interface Collection {
  collection_id: string;
  title: string;
  description?: string;
  created_at: string;
  icon?: string;
  color?: string;
}

export const collectionsService = {
  getCollections: async (): Promise<Collection[]> => {
    const response = await apiClient.get('/api/collections/');
    // Assuming backend returns { data: [...] } or just [...]
    return response.data.data || response.data || [];
  },

  getCollection: async (id: string): Promise<Collection> => {
    const response = await apiClient.get(`/api/collections/${id}`);
    return response.data.data || response.data;
  },

  deleteCollection: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/collections/${id}`);
  },

  getCollectionChapters: async (collectionId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/material/collections/${collectionId}/chapters`);
    const data = response.data.data ?? response.data;
    return Array.isArray(data) ? data : [];
  }
};
