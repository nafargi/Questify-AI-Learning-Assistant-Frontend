import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialsService } from '../services/materials.service';
import { SubscriptionContext } from '../context/subscription.context';
import { mockFetch, resetMockFetch } from './setup';
import { ValidationError, RateLimitError, AnalysisFailedError, TimeoutError } from '../client/questify.errors';

describe('MaterialsService', () => {
  beforeEach(() => {
    resetMockFetch();
    vi.spyOn(SubscriptionContext, 'getFileSizeLimit').mockReturnValue(5); // 5MB limit
    // Reset private timestamps for rate limiting
    (MaterialsService as any).analyzeTimestamps = [];
  });

  const createMockResponse = (status: number, data: any, ok = false) => {
    return {
      ok,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => data,
    };
  };

  describe('uploadMaterial', () => {
    it('rejects invalid MIME type before upload', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await expect(MaterialsService.uploadMaterial(file)).rejects.toThrow(ValidationError);
    });

    it('rejects file over size limit before upload', async () => {
      // 6MB file
      const file = new File(['a'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      await expect(MaterialsService.uploadMaterial(file)).rejects.toThrow(ValidationError);
    });
  });

  describe('queueAnalysis', () => {
    it('enforces rate limit client-side (2 req / 60s)', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, { success: true, data: { job_id: '123' } }, true));

      await MaterialsService.queueAnalysis('col-1');
      await MaterialsService.queueAnalysis('col-1');
      
      // Third call within 60s should fail client-side
      await expect(MaterialsService.queueAnalysis('col-1')).rejects.toThrow(RateLimitError);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('pollUntilDone', () => {
    it('stops polling when status === done', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(200, { success: true, data: { status: 'pending' } }, true))
        .mockResolvedValueOnce(createMockResponse(200, { success: true, data: { status: 'done' } }, true));

      const result = await MaterialsService.pollUntilDone('job-1', { intervalMs: 1 });
      expect(result.status).toBe('done');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws AnalysisFailedError when status === failed', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { 
        success: true, 
        data: { status: 'failed', error: 'Internal issue' } 
      }, true));

      await expect(MaterialsService.pollUntilDone('job-1', { intervalMs: 1 })).rejects.toThrow(AnalysisFailedError);
    });

    it('throws TimeoutError when polling exceeds timeoutMs', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, { success: true, data: { status: 'pending' } }, true));

      await expect(MaterialsService.pollUntilDone('job-1', { intervalMs: 10, timeoutMs: 20 }))
        .rejects.toThrow(TimeoutError);
    });
  });
});
