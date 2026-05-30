import { tokenManager } from './questify.auth-store';
import { logger } from './questify.logger';
import { requestCache } from './questify.cache';
import {
  QuestifyErrorCode,
  QuestifyError,
  NetworkError,
  TimeoutError,
  ParseError,
  UnexpectedContentTypeError,
  UnauthorizedError,
  AccountUnverifiedError,
  SubscriptionLimitError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from './questify.errors';

export const BASE_URL = 'https://questiai-43b71abdd48b.herokuapp.com/api';

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retryCount?: number;
  maxRetries?: number;
  isIdempotent?: boolean;
  ttlMs?: number;       // For GET requests, cache TTL
  skipCache?: boolean;
  onProgress?: (progress: number) => void; // Used in XMLHttpRequest wrapping later
}

// Global rate limit state
let rateLimitedUntil: number | null = null;

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class QuestifyClient {
  /**
   * Helper to determine if we are currently globally rate limited.
   */
  static getRateLimitedUntil(): number | null {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      return rateLimitedUntil;
    }
    return null;
  }

  /**
   * Core request method.
   */
  static async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      timeoutMs = 30000,
      maxRetries = 3,
      retryCount = 0,
      isIdempotent = ['GET', 'DELETE'].includes(method.toUpperCase()),
      ttlMs = 0,
      skipCache = false,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    // Deduplication & Caching for GET requests
    if (method.toUpperCase() === 'GET') {
      if (!skipCache && ttlMs > 0) {
        const cached = requestCache.get<T>(method, url);
        if (cached !== null) {
          logger.log({
            timestamp: new Date().toISOString(),
            requestId: 'cached',
            method: method.toUpperCase(),
            endpoint,
            statusCode: 200,
            durationMs: 0,
            success: true,
            cached: true,
            retryCount: 0,
          });
          return cached;
        }
      }

      const inFlight = requestCache.getInFlight<T>(method, url);
      if (inFlight) {
        return inFlight;
      }
    }

    const promise = this.doRequest<T>(endpoint, url, method, timeoutMs, maxRetries, retryCount, isIdempotent, fetchOptions)
      .then((data) => {
        if (method.toUpperCase() === 'GET' && ttlMs > 0 && !skipCache) {
          requestCache.set(method, url, data, ttlMs);
        }
        return data;
      })
      .finally(() => {
        if (method.toUpperCase() === 'GET') {
          requestCache.clearInFlight(method, url);
        }
      });

    if (method.toUpperCase() === 'GET') {
      requestCache.setInFlight(method, url, promise);
    } else {
      // It's a mutation. Invalidate related cache.
      // E.g. if we POST /material, invalidate any cache starting with /material
      const baseResource = endpoint.split('/')[1]; // e.g. "material"
      if (baseResource) {
        requestCache.invalidateByPrefix(`/${baseResource}`);
      }
    }

    return promise;
  }

  private static async doRequest<T>(
    endpoint: string,
    url: string,
    method: string,
    timeoutMs: number,
    maxRetries: number,
    retryCount: number,
    isIdempotent: boolean,
    fetchOptions: RequestInit
  ): Promise<T> {
    const requestId = generateRequestId();
    const startTime = performance.now();

    // Check global rate limit block
    const limitUntil = this.getRateLimitedUntil();
    if (limitUntil) {
      throw new RateLimitError(
        'Globally rate limited.',
        requestId,
        endpoint,
        Math.ceil((limitUntil - Date.now()) / 1000)
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(fetchOptions.headers);
    headers.set('X-Request-ID', requestId);

    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = tokenManager.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - startTime);

      if (err instanceof DOMException && err.name === 'AbortError') {
        logger.log({
          timestamp: new Date().toISOString(),
          requestId, method, endpoint, statusCode: null, durationMs, success: false,
          errorCode: QuestifyErrorCode.REQUEST_TIMEOUT, cached: false, retryCount
        });
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeoutMs}ms`, endpoint);
      }

      // Network error, connection refused, DNS, etc.
      // Retry transient network errors if idempotent
      if (isIdempotent && retryCount < maxRetries) {
        const backoffMs = this.calculateBackoff(retryCount);
        logger.log({
          timestamp: new Date().toISOString(),
          requestId, method, endpoint, statusCode: null, durationMs, success: false,
          errorCode: QuestifyErrorCode.NETWORK_FAILURE, cached: false, retryCount
        });
        await delay(backoffMs);
        return this.doRequest<T>(endpoint, url, method, timeoutMs, maxRetries, retryCount + 1, isIdempotent, fetchOptions);
      }

      logger.log({
        timestamp: new Date().toISOString(),
        requestId, method, endpoint, statusCode: null, durationMs, success: false,
        errorCode: QuestifyErrorCode.NETWORK_FAILURE, cached: false, retryCount
      });
      throw new NetworkError(`Network error while fetching ${endpoint}`, endpoint, err);
    }

    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - startTime);

    // Rate limit capture
    if (response.status === 429) {
      const retryAfterStr = response.headers.get('Retry-After');
      const retryAfterSec = retryAfterStr ? parseInt(retryAfterStr, 10) : 60;
      rateLimitedUntil = Date.now() + (retryAfterSec * 1000);
    }

    // Server/Gateway error retries (503, 504)
    if ((response.status === 503 || response.status === 504) && isIdempotent && retryCount < maxRetries) {
      const backoffMs = this.calculateBackoff(retryCount);
      logger.log({
        timestamp: new Date().toISOString(),
        requestId, method, endpoint, statusCode: response.status, durationMs, success: false,
        cached: false, retryCount
      });
      await delay(backoffMs);
      return this.doRequest<T>(endpoint, url, method, timeoutMs, maxRetries, retryCount + 1, isIdempotent, fetchOptions);
    }

    // Determine if content type is JSON
    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');

    // For non-streaming responses, we enforce JSON content type if it's supposed to be an API envelope
    // EXCEPT when it's a 204 No Content
    if (response.status !== 204 && !isJson && !fetchOptions.headers?.hasOwnProperty('Accept')) {
      logger.log({
        timestamp: new Date().toISOString(),
        requestId, method, endpoint, statusCode: response.status, durationMs, success: false,
        errorCode: QuestifyErrorCode.UNEXPECTED_CONTENT_TYPE, cached: false, retryCount
      });
      throw new UnexpectedContentTypeError(`Expected application/json, got ${contentType}`, endpoint);
    }

    let payload: any = null;
    if (response.status !== 204) {
      try {
        payload = await response.json();
      } catch (err: unknown) {
        logger.log({
          timestamp: new Date().toISOString(),
          requestId, method, endpoint, statusCode: response.status, durationMs, success: false,
          errorCode: QuestifyErrorCode.PARSE_FAILURE, cached: false, retryCount
        });
        throw new ParseError(`Failed to parse JSON response from ${endpoint}`, endpoint, err);
      }
    }

    // Success Envelope Check
    if (response.ok && (payload?.success === true || response.status === 204)) {
      logger.log({
        timestamp: new Date().toISOString(),
        requestId, method, endpoint, statusCode: response.status, durationMs, success: true,
        cached: false, retryCount
      });
      return response.status === 204 ? null as any : payload.data;
    }

    // It's an error. 
    // If it's a 401, immediately clear token and do not retry.
    if (response.status === 401) {
      tokenManager.clearToken();
    }

    const message = payload?.message || `API Error: ${response.statusText}`;
    this.mapAndThrowError(response.status, message, payload, requestId, endpoint);
    
    // Unreachable, mapAndThrowError always throws
    throw new Error('Unreachable');
  }

  private static calculateBackoff(retryCount: number): number {
    const baseDelay = 500;
    const multiplier = 2;
    const maxDelay = 10000;
    const jitter = 0.8 + Math.random() * 0.4; // ±20%
    const delay = Math.min(baseDelay * Math.pow(multiplier, retryCount) * jitter, maxDelay);
    return Math.round(delay);
  }

  private static mapAndThrowError(
    status: number,
    message: string,
    payload: any,
    requestId: string,
    endpoint: string
  ): never {
    const codeStr = payload?.code as string | undefined;

    switch (status) {
      case 400:
        if (codeStr === 'RATE_LIMITED' || message.toLowerCase().includes('rate limit')) {
          const retryAfterSec = payload?.retry_after || 60;
          throw new RateLimitError(message, requestId, endpoint, retryAfterSec);
        }
        throw new ValidationError(message, requestId, endpoint, payload?.errors);
      
      case 401:
        throw new UnauthorizedError(message, requestId, endpoint);
      
      case 403:
        if (codeStr === 'ACCOUNT_UNVERIFIED' || message.includes('unverified')) {
          throw new AccountUnverifiedError(message, requestId, endpoint);
        }
        if (codeStr === 'MATERIAL_LIMIT_REACHED' || message.includes('material limit')) {
          throw new SubscriptionLimitError(QuestifyErrorCode.MATERIAL_LIMIT_REACHED, message, requestId, endpoint);
        }
        if (codeStr === 'AI_REQUEST_LIMIT_REACHED') {
          throw new SubscriptionLimitError(QuestifyErrorCode.AI_REQUEST_LIMIT_REACHED, message, requestId, endpoint);
        }
        if (codeStr === 'EXAM_GENERATION_DISABLED') {
          throw new SubscriptionLimitError(QuestifyErrorCode.EXAM_GENERATION_DISABLED, message, requestId, endpoint);
        }
        if (codeStr === 'CHAT_DISABLED') {
          throw new SubscriptionLimitError(QuestifyErrorCode.CHAT_DISABLED, message, requestId, endpoint);
        }
        if (codeStr === 'SUBSCRIPTION_REQUIRED' || message.includes('plan')) {
          throw new SubscriptionLimitError(QuestifyErrorCode.SUBSCRIPTION_REQUIRED, message, requestId, endpoint);
        }
        throw new ForbiddenError(QuestifyErrorCode.FORBIDDEN, message, requestId, endpoint);
      
      case 404:
        throw new NotFoundError(message, requestId, endpoint);
      
      case 409:
        throw new ConflictError(message, requestId, endpoint);
      
      case 429:
        const retryAfterSec = payload?.retry_after || 60;
        throw new RateLimitError(message, requestId, endpoint, retryAfterSec);
      
      case 500:
      default:
        throw new InternalServerError(message, requestId, endpoint);
    }
  }

  // Helpful aliases
  static get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    const fetchOpts: RequestOptions = { ...options, method: 'POST' };
    if (body) {
      fetchOpts.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, fetchOpts);
  }

  static put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    const fetchOpts: RequestOptions = { ...options, method: 'PUT' };
    if (body) {
      fetchOpts.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, fetchOpts);
  }

  static patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    const fetchOpts: RequestOptions = { ...options, method: 'PATCH' };
    if (body) {
      fetchOpts.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request<T>(endpoint, fetchOpts);
  }

  static delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
