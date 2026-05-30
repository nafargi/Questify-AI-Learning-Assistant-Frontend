import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestifyClient } from '../client/questify.client';
import { tokenManager } from '../client/questify.auth-store';
import { mockFetch, resetMockFetch } from './setup';
import {
  UnauthorizedError,
  SubscriptionLimitError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  NetworkError,
  TimeoutError,
} from '../client/questify.errors';

describe('QuestifyClient Core Logic', () => {
  beforeEach(() => {
    resetMockFetch();
    tokenManager.clearToken();
  });

  const createMockResponse = (status: number, data: any, ok = false) => {
    return {
      ok,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => data,
    };
  };

  it('Happy path: returns typed data on 200', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(200, { success: true, data: { id: 1 } }, true));
    const result = await QuestifyClient.get('/test');
    expect(result).toEqual({ id: 1 });
  });

  it('401 triggers clearToken() and throws UnauthorizedError', async () => {
    tokenManager.setToken('fake-token');
    mockFetch.mockResolvedValueOnce(createMockResponse(401, { success: false, message: 'Invalid token' }));
    
    await expect(QuestifyClient.get('/test')).rejects.toThrow(UnauthorizedError);
    expect(tokenManager.getToken()).toBeNull();
  });

  it('403 maps to SubscriptionLimitError when code matches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(403, { 
      success: false, 
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Plan upgrade required' 
    }));
    await expect(QuestifyClient.get('/test')).rejects.toThrow(SubscriptionLimitError);
  });

  it('404 maps to NotFoundError', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(404, { success: false, message: 'Not found' }));
    await expect(QuestifyClient.get('/test')).rejects.toThrow(NotFoundError);
  });

  it('409 maps to ConflictError', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(409, { success: false, message: 'Conflict' }));
    await expect(QuestifyClient.get('/test')).rejects.toThrow(ConflictError);
  });

  it('500 maps to InternalServerError', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(500, { success: false, message: 'Server error' }));
    await expect(QuestifyClient.get('/test')).rejects.toThrow(InternalServerError);
  });

  it('Network failure throws NetworkError', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    // Disable retry for this test to fail fast
    await expect(QuestifyClient.get('/test', { maxRetries: 0 })).rejects.toThrow(NetworkError);
  });

  it('Timeout throws TimeoutError', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);
    await expect(QuestifyClient.get('/test')).rejects.toThrow(TimeoutError);
  });

  it('Retry logic: GET retries on 503', async () => {
    // 1st fails 503, 2nd succeeds 200
    mockFetch
      .mockResolvedValueOnce(createMockResponse(503, { success: false, message: 'Service Unavailable' }))
      .mockResolvedValueOnce(createMockResponse(200, { success: true, data: { ok: true } }, true));

    const result = await QuestifyClient.get('/test', { maxRetries: 1 });
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('Retry logic: POST does not retry on 503', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(503, { success: false, message: 'Service Unavailable' }));
    await expect(QuestifyClient.post('/test', {}, { maxRetries: 3 })).rejects.toThrow(InternalServerError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
