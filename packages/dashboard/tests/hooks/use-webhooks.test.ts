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
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from '@/hooks/use-webhooks';

describe('useWebhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches webhooks list for a project', async () => {
    const mockList = [
      { id: 'wh-1', projectId: 'proj-1', url: 'https://example.com/hook', events: ['report.created'], isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: mockList });

    const { result } = renderHook(
      () => useWebhooks('proj-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/webhooks?project_id=proj-1',
    );
    expect(result.current.data).toEqual(mockList);
  });

  it('is disabled when projectId is empty', () => {
    const { result } = renderHook(
      () => useWebhooks(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useCreateWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST with url and events', async () => {
    const mockWebhook = { id: 'wh-2', url: 'https://example.com/hook', events: ['report.created'] };
    mockApiClient.post.mockResolvedValueOnce({ data: mockWebhook });

    const { result } = renderHook(
      () => useCreateWebhook(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      projectId: 'proj-1',
      data: { url: 'https://example.com/hook', events: ['report.created'] },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/webhooks?project_id=proj-1',
      { url: 'https://example.com/hook', events: ['report.created'] },
    );
  });
});

describe('useUpdateWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH with data', async () => {
    const mockUpdated = { id: 'wh-1', isActive: false };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useUpdateWebhook(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      webhookId: 'wh-1',
      projectId: 'proj-1',
      data: { isActive: false },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith(
      '/webhooks/wh-1',
      { isActive: false },
    );
  });
});

describe('useDeleteWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends DELETE request', async () => {
    mockApiClient.delete.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useDeleteWebhook(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ webhookId: 'wh-1', projectId: 'proj-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.delete).toHaveBeenCalledWith('/webhooks/wh-1');
  });
});
