import { vi } from 'vitest';

// Mock matchMedia if not present
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Global fetch mock helper
export const mockFetch = vi.fn();
global.fetch = mockFetch;

export function resetMockFetch() {
  mockFetch.mockReset();
}
