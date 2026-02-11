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
  useIntegrations,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  useExportToTracker,
} from '@/hooks/use-integrations';

describe('useIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches integrations list', async () => {
    const mockList = [
      { id: 'int-1', provider: 'github', isActive: true },
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: mockList });

    const { result } = renderHook(
      () => useIntegrations('proj-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/projects/proj-1/integrations',
    );
    expect(result.current.data).toEqual(mockList);
  });

  it('is disabled when projectId is empty', () => {
    const { result } = renderHook(
      () => useIntegrations(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useCreateIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST with provider and config', async () => {
    const mockIntegration = { id: 'int-2', provider: 'github' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockIntegration });

    const { result } = renderHook(
      () => useCreateIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      projectId: 'proj-1',
      data: { provider: 'github', config: { token: 'gh-tok', owner: 'me', repo: 'app' } },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects/proj-1/integrations',
      { provider: 'github', config: { token: 'gh-tok', owner: 'me', repo: 'app' } },
    );
  });
});

describe('useUpdateIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH with data', async () => {
    const mockUpdated = { id: 'int-1', isActive: false };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useUpdateIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      integrationId: 'int-1',
      projectId: 'proj-1',
      data: { isActive: false },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith(
      '/integrations/int-1',
      { isActive: false },
    );
  });
});

describe('useDeleteIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends DELETE request', async () => {
    mockApiClient.delete.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useDeleteIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ integrationId: 'int-1', projectId: 'proj-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.delete).toHaveBeenCalledWith('/integrations/int-1');
  });
});

describe('useExportToTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST to export endpoint', async () => {
    const mockResult = { issueUrl: 'https://github.com/o/r/issues/1', issueIdentifier: null };
    mockApiClient.post.mockResolvedValueOnce({ data: mockResult });

    const { result } = renderHook(
      () => useExportToTracker(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ reportId: 'bug-1', provider: 'github' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/reports/bug-1/export/github',
    );
    expect(result.current.data).toEqual(mockResult);
  });
});
