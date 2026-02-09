import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient, { setAccessToken, getAccessToken } from '@/lib/api-client';

describe('api-client', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  describe('setAccessToken / getAccessToken', () => {
    it('stores and retrieves the token', () => {
      expect(getAccessToken()).toBeNull();
      setAccessToken('my-token');
      expect(getAccessToken()).toBe('my-token');
    });

    it('clears the token when set to null', () => {
      setAccessToken('my-token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists', async () => {
      setAccessToken('test-jwt-token');

      const interceptors = apiClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      };
      const interceptor = interceptors.handlers[0].fulfilled;

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
          Authorization: undefined as string | undefined,
        },
        baseURL: undefined as string | undefined,
      };

      const result = interceptor(config as unknown as Record<string, unknown>) as typeof config;
      expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
    });

    it('omits Authorization header when no token', async () => {
      setAccessToken(null);

      const interceptors = apiClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      };
      const interceptor = interceptors.handlers[0].fulfilled;

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
          Authorization: undefined as string | undefined,
        },
        baseURL: undefined as string | undefined,
      };

      const result = interceptor(config as unknown as Record<string, unknown>) as typeof config;
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('sets baseURL from environment', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      const interceptors = apiClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      };
      const interceptor = interceptors.handlers[0].fulfilled;

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
        },
        baseURL: undefined as string | undefined,
      };

      const result = interceptor(config as unknown as Record<string, unknown>) as typeof config;
      expect(result.baseURL).toBe('https://api.example.com');

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('falls back to default baseURL', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      const interceptors = apiClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      };
      const interceptor = interceptors.handlers[0].fulfilled;

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
        },
        baseURL: undefined as string | undefined,
      };

      const result = interceptor(config as unknown as Record<string, unknown>) as typeof config;
      expect(result.baseURL).toBe('http://localhost:8000/api/v1');

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });
});
