import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginApi, registerApi, logoutApi, getMeApi } from '@/lib/auth';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('auth API functions', () => {
  const mockUser = {
    id: 'u1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: '2025-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginApi', () => {
    it('calls POST /auth/login and returns user', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockUser });
      const result = await loginApi('test@example.com', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('registerApi', () => {
    it('calls POST /auth/register and returns user', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockUser });
      const result = await registerApi('Test', 'test@example.com', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('logoutApi', () => {
    it('calls POST /auth/logout', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { detail: 'Logged out' } });
      await logoutApi();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getMeApi', () => {
    it('calls GET /auth/me', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockUser });
      const result = await getMeApi();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });
});
