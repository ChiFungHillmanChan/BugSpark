import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginApi, registerApi, refreshApi, getMeApi } from '@/lib/auth';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('auth API functions', () => {
  const mockAuthResponse = {
    accessToken: 'access-123',
    refreshToken: 'refresh-456',
    user: { id: 'u1', name: 'Test', email: 'test@example.com', createdAt: '2025-01-01' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginApi', () => {
    it('calls POST /auth/login with correct body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
      const result = await loginApi('test@example.com', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('registerApi', () => {
    it('calls POST /auth/register with correct body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
      const result = await registerApi('Test', 'test@example.com', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refreshApi', () => {
    it('calls POST /auth/refresh with correct body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });
      const result = await refreshApi('refresh-token-xyz');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh-token-xyz',
      });
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getMeApi', () => {
    it('calls GET /auth/me', async () => {
      const mockUser = { id: 'u1', name: 'Test', email: 'test@example.com', createdAt: '2025-01-01' };
      mockApiClient.get.mockResolvedValueOnce({ data: mockUser });
      const result = await getMeApi();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });
});
