import { tokenManager } from './questify.auth-store';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class QuestifyCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();

  /**
   * Generates a cache key based on the method, URL, and stringified query params (already in URL)
   */
  private generateKey(method: string, url: string): string {
    return `${method}:${url}`;
  }

  /**
   * Sets data in the cache with a specific TTL in milliseconds.
   */
  set<T>(method: string, url: string, data: T, ttlMs: number): void {
    if (ttlMs <= 0) return;
    
    const key = this.generateKey(method, url);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Retrieves data from the cache if it exists and is not expired.
   */
  get<T>(method: string, url: string): T | null {
    const key = this.generateKey(method, url);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Records an in-flight request to prevent deduplication.
   */
  setInFlight(method: string, url: string, promise: Promise<unknown>): void {
    const key = this.generateKey(method, url);
    this.inFlightRequests.set(key, promise);
  }

  /**
   * Gets an existing in-flight request if one exists.
   */
  getInFlight<T>(method: string, url: string): Promise<T> | null {
    const key = this.generateKey(method, url);
    return (this.inFlightRequests.get(key) as Promise<T>) || null;
  }

  /**
   * Removes an in-flight request record.
   */
  clearInFlight(method: string, url: string): void {
    const key = this.generateKey(method, url);
    this.inFlightRequests.delete(key);
  }

  /**
   * Invalidates any cached requests that match the given pattern or url.
   * Typically used after POST/PUT/PATCH/DELETE on a resource.
   * If a specific url is provided (like '/api/materials/'), we can invalidate anything starting with that base.
   */
  invalidateByPrefix(urlPrefix: string): void {
    for (const key of this.cache.keys()) {
      // Key format: "GET:https://..."
      const [ , cachedUrl] = key.split(':', 2);
      if (cachedUrl && cachedUrl.includes(urlPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache. Called on logout/clearToken.
   */
  clearAll(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }
}

export const requestCache = new QuestifyCache();

// Automatically clear cache on logout
if (typeof window !== 'undefined') {
  window.addEventListener('questify:auth:cleared', () => {
    requestCache.clearAll();
  });
}
