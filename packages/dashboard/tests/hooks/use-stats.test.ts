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

import { useDashboardStats, useBugTrends, useAggregatedStats } from '@/hooks/use-stats';

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches overview without project filter', async () => {
    const mockStats = { totalBugs: 10, openBugs: 3, resolvedBugs: 7 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(
      () => useDashboardStats(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/stats/overview');
    expect(result.current.data).toEqual(mockStats);
  });

  it('includes query param when projectId is provided', async () => {
    const mockStats = { totalBugs: 5, openBugs: 2, resolvedBugs: 3 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(
      () => useDashboardStats('proj-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/stats/overview?project_id=proj-1',
    );
  });
});

describe('useBugTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches project stats', async () => {
    const mockTrends = { daily: [], weekly: [] };
    mockApiClient.get.mockResolvedValueOnce({ data: mockTrends });

    const { result } = renderHook(
      () => useBugTrends('proj-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/stats/projects/proj-1');
    expect(result.current.data).toEqual(mockTrends);
  });

  it('is disabled when projectId is empty', () => {
    const { result } = renderHook(
      () => useBugTrends(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useAggregatedStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches aggregated stats', async () => {
    const mockAggregated = { daily: [], weekly: [] };
    mockApiClient.get.mockResolvedValueOnce({ data: mockAggregated });

    const { result } = renderHook(
      () => useAggregatedStats(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/stats/aggregated');
    expect(result.current.data).toEqual(mockAggregated);
  });
});
