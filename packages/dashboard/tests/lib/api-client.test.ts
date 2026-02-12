import { describe, it, expect, vi } from 'vitest';
import apiClient from '@/lib/api-client';

describe('api-client', () => {
  describe('request interceptor', () => {
    it('sets withCredentials on the axios instance', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
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
      expect(result.baseURL).toBe('https://api.bugspark.hillmanchan.com/api/v1');

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });
});
