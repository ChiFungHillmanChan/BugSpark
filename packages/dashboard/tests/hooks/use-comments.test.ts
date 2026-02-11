import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

import { useComments, useAddComment } from '@/hooks/use-comments';

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches comments for a report', async () => {
    const mockComments = [
      { id: 'c1', reportId: 'r1', body: 'hello', authorName: 'Alice', createdAt: '2025-01-01' },
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: mockComments });

    const { result } = renderHook(
      () => useComments('r1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/reports/r1/comments');
    expect(result.current.data).toEqual(mockComments);
  });

  it('is disabled when reportId is empty', () => {
    const { result } = renderHook(
      () => useComments(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useAddComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST with body', async () => {
    const mockComment = { id: 'c2', reportId: 'r1', body: 'new comment', authorName: 'Bob', createdAt: '2025-01-02' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockComment });

    const { result } = renderHook(
      () => useAddComment(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ reportId: 'r1', body: 'new comment' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/reports/r1/comments',
      { body: 'new comment' },
    );
  });

  it('has optimistic update in cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(['comments', 'report-1'], []);

    // Never-resolving promise keeps mutation pending so we can inspect optimistic state
    mockApiClient.post.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useAddComment(),
      { wrapper: createWrapper(queryClient) },
    );

    act(() => {
      result.current.mutate({ reportId: 'report-1', body: 'optimistic text' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Array<{ body: string }>>(['comments', 'report-1']);
      expect(cached).toHaveLength(1);
      expect(cached![0].body).toBe('optimistic text');
    });
  });
});
