import { QuestifyClient, BASE_URL } from '../client/questify.client';
import { tokenManager } from '../client/questify.auth-store';
import { ValidationError, RateLimitError, TimeoutError, AnalysisFailedError } from '../client/questify.errors';
import { SubscriptionContext } from '../context/subscription.context';
import { Material, AnalysisJob, AnalysisJobStatus } from '../types';
import { Collection } from '../types';
import { Chapter } from '../types';

export class MaterialsService {
  private static analyzeTimestamps: number[] = [];

  static async listMaterials(): Promise<Material[]> {
    return QuestifyClient.get<Material[]>('/material/', { ttlMs: 15000 });
  }

  static async getMaterial(id: string): Promise<Material> {
    return QuestifyClient.get<Material>(`/material/${id}`);
  }

  static getDownloadUrl(id: string): string {
    return `${BASE_URL}/material/${id}/download`;
  }

  static async downloadMaterial(id: string): Promise<void> {
    const url = this.getDownloadUrl(id);
    const token = tokenManager.getToken();
    
    // Create an invisible anchor tag to trigger download
    const a = document.createElement('a');
    a.style.display = 'none';
    
    // We can fetch the blob to get Content-Disposition properly if needed
    // or just rely on browser if auth is by cookie. If Bearer is strict:
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download material: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Attempt to extract filename from header
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  }

  static async uploadMaterial(file: File, onProgress?: (progress: number) => void): Promise<Material> {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Invalid file type. Only PDF is allowed currently.', 'local', '/material/upload');
    }

    const limitMb = SubscriptionContext.getFileSizeLimit();
    if (file.size > limitMb * 1024 * 1024) {
      throw new ValidationError(`File size exceeds your plan limit of ${limitMb}MB`, 'local', '/material/upload');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/material/upload`);
      
      const token = tokenManager.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              // Invalidate materials cache
              QuestifyClient.request('/material/', { skipCache: true }).catch(() => {});
              resolve(response.data);
            } else {
              reject(new Error(response.message));
            }
          } catch (err) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          if (xhr.status === 401) {
            tokenManager.clearToken();
          }
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  static async deleteMaterial(id: string): Promise<void> {
    await QuestifyClient.delete(`/material/${id}`);
  }

  static async preprocessMaterials(materialIds: string[]): Promise<Collection> {
    if (!materialIds || materialIds.length === 0) {
      throw new ValidationError('At least one material ID is required', 'local', '/material/preprocess');
    }
    if (materialIds.length > 50) {
      throw new ValidationError('Maximum of 50 materials allowed per preprocess request', 'local', '/material/preprocess');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of materialIds) {
      if (!uuidRegex.test(id)) {
        throw new ValidationError(`Invalid material ID format: ${id}`, 'local', '/material/preprocess');
      }
    }

    return QuestifyClient.post<Collection>('/material/preprocess', { material_ids: materialIds });
  }

  static async queueAnalysis(collectionId: string, confidence: number = 0.8): Promise<AnalysisJob> {
    const clampedConfidence = Math.max(0.0, Math.min(1.0, confidence));
    
    // Rate limit check: max 2 req per 60s
    const now = Date.now();
    this.analyzeTimestamps = this.analyzeTimestamps.filter(ts => now - ts < 60000);
    if (this.analyzeTimestamps.length >= 2) {
      const oldest = this.analyzeTimestamps[0];
      const retryAfterSec = Math.ceil((60000 - (now - oldest)) / 1000);
      throw new RateLimitError('Analyze rate limit reached', 'local', '/material/analyze', retryAfterSec);
    }
    this.analyzeTimestamps.push(now);

    return QuestifyClient.post<AnalysisJob>('/material/analyze', {
      collection_id: collectionId,
      confidence: clampedConfidence
    });
  }

  static getAnalyzeRateLimitStatus(): { isLimited: boolean; retryInMs: number | null } {
    const now = Date.now();
    this.analyzeTimestamps = this.analyzeTimestamps.filter(ts => now - ts < 60000);
    if (this.analyzeTimestamps.length >= 2) {
      const retryInMs = 60000 - (now - this.analyzeTimestamps[0]);
      return { isLimited: true, retryInMs };
    }
    return { isLimited: false, retryInMs: null };
  }

  static async pollAnalysisStatus(jobId: string): Promise<AnalysisJobStatus> {
    return QuestifyClient.get<AnalysisJobStatus>(`/material/analyze/${jobId}/status`);
  }

  static async pollUntilDone(
    jobId: string,
    options: { intervalMs?: number; timeoutMs?: number; onStatusChange?: (status: string) => void } = {}
  ): Promise<AnalysisJobStatus> {
    const intervalMs = options.intervalMs || 2000;
    const timeoutMs = options.timeoutMs || 300000; // 5 mins
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        throw new TimeoutError('Polling timed out', `/material/analyze/${jobId}/status`);
      }

      const status = await this.pollAnalysisStatus(jobId);
      
      if (options.onStatusChange) {
        options.onStatusChange(status.status);
      }

      if (status.status === 'done') {
        return status;
      }

      if (status.status === 'failed') {
        throw new AnalysisFailedError('Analysis failed', 'local', `/material/analyze/${jobId}/status`, status.error);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  static async listChapters(collectionId: string): Promise<Chapter[]> {
    return QuestifyClient.get<Chapter[]>(`/material/collections/${collectionId}/chapters`);
  }
}
