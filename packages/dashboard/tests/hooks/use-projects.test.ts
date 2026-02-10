import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useProjects, useProject, useCreateProject, useDeleteProject } from '@/hooks/use-projects';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all projects', async () => {
    const mockProjects = [
      { id: 'p1', name: 'Project A', domain: 'a.com' },
      { id: 'p2', name: 'Project B', domain: 'b.com' },
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: mockProjects });

    const { result } = renderHook(
      () => useProjects(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/projects');
    expect(result.current.data).toEqual(mockProjects);
  });
});

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single project', async () => {
    const mockProject = { id: 'p1', name: 'Project A', domain: 'a.com' };
    mockApiClient.get.mockResolvedValueOnce({ data: mockProject });

    const { result } = renderHook(
      () => useProject('p1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/projects/p1');
    expect(result.current.data).toEqual(mockProject);
  });

  it('does not fetch when id is empty', () => {
    mockApiClient.get.mockResolvedValueOnce({ data: null });

    renderHook(
      () => useProject(''),
      { wrapper: createWrapper() },
    );

    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST request', async () => {
    const mockCreated = { id: 'p-new', name: 'New Project', domain: 'new.com' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockCreated });

    const { result } = renderHook(
      () => useCreateProject(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ name: 'New Project', domain: 'new.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith('/projects', {
      name: 'New Project',
      domain: 'new.com',
    });
  });
});

describe('useDeleteProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends DELETE request with permanent flag', async () => {
    mockApiClient.delete.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useDeleteProject(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('p1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.delete).toHaveBeenCalledWith('/projects/p1?permanent=true');
  });
});
