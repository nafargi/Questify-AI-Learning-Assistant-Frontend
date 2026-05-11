import apiClient from './apiClient';

export interface UploadResponse {
  material_id: string;
}

export interface PreprocessResponse {
  collection_id: string;
}

export interface AnalyzedChapter {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  chapter_description: string;
  keywords: string[];
}

export interface AnalyzeResponse {
  document_title: string;
  main_description: string;
  total_chapters: number;
  chapters: AnalyzedChapter[];
}

export interface Material {
  id: string;
  title: string;
  name?: string;
  description: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export const materialService = {
  upload: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('--- Upload Diagnostic Start ---');
    console.log('Uploading file:', file.name, file.type, file.size);
    console.log('Request URL:', (apiClient.defaults.baseURL || '') + '/api/material/upload');
    console.log('Auth token present?', !!localStorage.getItem('access_token'));
    
    try {
      const response = await apiClient.post('/api/material/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      console.log('Upload success:', response.data);
      console.log('--- Upload Diagnostic End (Success) ---');
      return response.data.data;
    } catch (error: any) {
      console.error('--- Upload Diagnostic End (Error) ---');
      console.error('Upload error details:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
        if (error.response.data && error.response.data.detail) {
          console.error('Validation errors:', JSON.stringify(error.response.data.detail, null, 2));
        }
      } else if (error.request) {
        console.error('No response received (Network Error?):', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },


  preprocess: async (materialIds: string[]): Promise<PreprocessResponse> => {
    console.log('--- Preprocess Request Start ---');
    console.log('Material IDs:', materialIds);
    console.log('Request body:', JSON.stringify({ material_ids: materialIds }));
    console.log('Request URL:', (apiClient.defaults.baseURL || '') + '/api/material/preprocess');
    console.log('Auth token present?', !!localStorage.getItem('access_token'));
    try {
      const response = await apiClient.post('/api/material/preprocess', {
        material_ids: materialIds,
      });
      console.log('Preprocess RAW response.data:', JSON.stringify(response.data));
      // Backend wraps as { success, message, data: { collection_id } }
      const result = response.data.data;
      console.log('Preprocess unwrapped result:', JSON.stringify(result));
      console.log('--- Preprocess Request End (Success) ---');
      return result;
    } catch (error: any) {
      console.error('--- Preprocess Request End (Error) ---');
      console.error('Preprocess error details:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('No response received (Network Error?):', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  analyze: async (collectionId: string, confidence: number = 50): Promise<AnalyzeResponse> => {
    const body = { collection_id: collectionId, confidence: confidence };
    console.log('--- Analyze Request Start ---');
    console.log('Collection ID:', collectionId);
    console.log('Confidence:', confidence);
    console.log('Full request body:', JSON.stringify(body));
    console.log('Request URL:', (apiClient.defaults.baseURL || '') + '/api/material/analyze');

    try {
      const response = await apiClient.post('/api/material/analyze', body);
      console.log('Analyze RAW response.data:', JSON.stringify(response.data));
      const result: AnalyzeResponse = response.data.data || response.data;
      console.log('Analyze unwrapped result:', JSON.stringify(result));
      console.log('--- Analyze Request End (Success) ---');
      return result;
    } catch (error: any) {
      console.error('--- Analyze Request End (Error) ---');
      console.error('Analyze error details:', error);
      throw error;
    }
  },

  /**
   * GET /api/material/
   * Retrieves all materials for the current user.
   */
  getMaterials: async (): Promise<Material[]> => {
    try {
      const response = await apiClient.get('/api/material/');
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('[materialService] getMaterials failed', error);
      throw error;
    }
  },

  /**
   * GET /api/material/{material_id}
   * Retrieves a specific material by ID.
   */
  getMaterial: async (materialId: string): Promise<Material> => {
    try {
      const response = await apiClient.get(`/api/material/${materialId}`);
      return response.data.data ?? response.data;
    } catch (error: any) {
      console.error(`[materialService] getMaterial failed for ${materialId}`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/material/{material_id}
   * Deletes a specific material.
   */
  deleteMaterial: async (materialId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/material/${materialId}`);
    } catch (error: any) {
      console.error(`[materialService] deleteMaterial failed for ${materialId}`, error);
      throw error;
    }
  },

  /**
   * GET /api/material/{material_id}/file
   * Fetches the PDF binary and returns a temporary blob URL for display.
   */
  getPdfBlobUrl: async (materialId: string): Promise<string | null> => {
    try {
      const response = await apiClient.get(`/api/material/${materialId}/file`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error(`[materialService] getPdfBlobUrl failed for ${materialId}`, error);
      return null;
    }
  },

  /**
   * GET /api/material/collections/{collection_id}/materials
   * Retrieves the materials (with IDs) for a given collection.
   */
  getMaterialsByCollection: async (collectionId: string): Promise<Material[]> => {
    try {
      const response = await apiClient.get(`/api/material/collections/${collectionId}/materials`);
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error(`[materialService] getMaterialsByCollection failed for ${collectionId}`, error);
      return [];
    }
  },
};
