import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { mockFetch, resetMockFetch } from './setup';
import { ValidationError } from '../client/questify.errors';

describe('AuthService', () => {
  beforeEach(() => {
    resetMockFetch();
  });

  const createMockResponse = (status: number, data: any, ok = false) => {
    return {
      ok,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => data,
    };
  };

  describe('verifyEmail', () => {
    it('strips non-digits from OTP and throws if length !== 6', async () => {
      await expect(AuthService.verifyEmail({ email: 'test@test.com', otp: '123-abc' }))
        .rejects.toThrow(ValidationError);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('succeeds with valid OTP', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { success: true }, true));
      await expect(AuthService.verifyEmail({ email: 'test@test.com', otp: '123-456' }))
        .resolves.not.toThrow();
        
      // Check that what was sent was actually sanitized
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.otp).toBe('123456');
    });
  });

  describe('login', () => {
    it('rejects invalid payload without network call', async () => {
      await expect(AuthService.login({ email: 'not-an-email', password: '' }))
        .rejects.toThrow(); // Zod error wraps into ValidationError or direct ZodError
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
