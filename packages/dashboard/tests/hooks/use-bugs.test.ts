import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useBugs, useBug, useUpdateBug, useDeleteBug } from '@/hooks/use-bugs';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

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

describe('useBugs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches bugs with correct params', async () => {
    const mockData = { items: [], total: 0, page: 1, pageSize: 20 };
    mockApiClient.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useBugs({ search: 'crash', status: ['new'], page: 1 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('search=crash'),
    );
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('status=new'),
    );
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useBug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single bug', async () => {
    const mockBug = { id: 'bug-1', title: 'Test Bug' };
    mockApiClient.get.mockResolvedValueOnce({ data: mockBug });

    const { result } = renderHook(
      () => useBug('bug-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/reports/bug-1');
    expect(result.current.data).toEqual(mockBug);
  });
});

describe('useUpdateBug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH request', async () => {
    const mockUpdated = { id: 'bug-1', status: 'resolved' };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useUpdateBug(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'bug-1', data: { status: 'resolved' as const } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith('/reports/bug-1', {
      status: 'resolved',
    });
  });
});

describe('useDeleteBug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends DELETE request', async () => {
    mockApiClient.delete.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useDeleteBug(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('bug-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.delete).toHaveBeenCalledWith('/reports/bug-1');
  });
});
