import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '@/lib/api-client';
const mockApiClient = vi.mocked(apiClient, true);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

import {
  useAdminUsers,
  usePlatformStats,
  useAdminReports,
  useAdminUpdateUser,
  useAdminSettings,
  useAdminUpdateSettings,
  useAdminBetaUsers,
  useAdminApproveBeta,
  useAdminRejectBeta,
} from '@/hooks/use-admin';

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users with params', async () => {
    const mockData = { items: [{ id: 'u1', email: 'a@b.com' }], total: 1 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useAdminUsers({ search: 'alice', role: 'admin', page: 1 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users', {
      params: { search: 'alice', role: 'admin', page: 1 },
    });
    expect(result.current.data).toEqual(mockData);
  });
});

describe('usePlatformStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches platform stats', async () => {
    const mockStats = { totalUsers: 100, totalProjects: 20 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(
      () => usePlatformStats(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/stats');
    expect(result.current.data).toEqual(mockStats);
  });
});

describe('useAdminReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches reports with params', async () => {
    const mockData = { items: [], total: 0 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useAdminReports({ severity: 'high', status: 'new', page: 2, pageSize: 10 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/reports', {
      params: { severity: 'high', status: 'new', page: 2, page_size: 10 },
    });
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useAdminUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH with user data', async () => {
    const mockUpdated = { id: 'u1', role: 'admin' };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useAdminUpdateUser(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ userId: 'u1', data: { role: 'admin', is_active: true } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith('/admin/users/u1', {
      role: 'admin',
      is_active: true,
    });
  });
});

describe('useAdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches admin settings', async () => {
    const mockSettings = { betaModeEnabled: true };
    mockApiClient.get.mockResolvedValueOnce({ data: mockSettings });

    const { result } = renderHook(
      () => useAdminSettings(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/settings');
    expect(result.current.data).toEqual(mockSettings);
  });
});

describe('useAdminUpdateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH with settings data', async () => {
    const mockUpdated = { betaModeEnabled: false };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useAdminUpdateSettings(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ betaModeEnabled: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith('/admin/settings', {
      beta_mode_enabled: false,
    });
  });
});

describe('useAdminBetaUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches beta users with params', async () => {
    const mockData = { items: [{ id: 'u1', status: 'pending' }], total: 1 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useAdminBetaUsers({ status: 'pending', page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/beta-users', {
      params: { status: 'pending', page: 1, page_size: 20 },
    });
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useAdminApproveBeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST to approve endpoint', async () => {
    const mockUser = { id: 'u1', status: 'approved' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(
      () => useAdminApproveBeta(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('u1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/admin/beta-users/u1/approve',
    );
  });
});

describe('useAdminRejectBeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST to reject endpoint', async () => {
    const mockUser = { id: 'u1', status: 'rejected' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(
      () => useAdminRejectBeta(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('u1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/admin/beta-users/u1/reject',
    );
  });
});
