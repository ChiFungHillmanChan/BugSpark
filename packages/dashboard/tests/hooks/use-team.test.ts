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
  useTeamMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useAcceptInvite,
} from '@/hooks/use-team';

describe('useTeamMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches members for project', async () => {
    const mockMembers = [
      { id: 'm1', userId: 'u1', email: 'a@b.com', role: 'admin' },
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: mockMembers });

    const { result } = renderHook(
      () => useTeamMembers('proj-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/projects/proj-1/members');
    expect(result.current.data).toEqual(mockMembers);
  });

  it('is disabled when projectId is empty', () => {
    const { result } = renderHook(
      () => useTeamMembers(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useInviteMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST with email and role', async () => {
    const mockMember = { id: 'm2', email: 'new@b.com', role: 'member' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockMember });

    const { result } = renderHook(
      () => useInviteMember('proj-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ email: 'new@b.com', role: 'member' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/projects/proj-1/members',
      { email: 'new@b.com', role: 'member' },
    );
  });
});

describe('useUpdateMemberRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH with role', async () => {
    const mockUpdated = { id: 'm1', role: 'admin' };
    mockApiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const { result } = renderHook(
      () => useUpdateMemberRole('proj-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ memberId: 'm1', role: 'admin' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.patch).toHaveBeenCalledWith(
      '/projects/proj-1/members/m1',
      { role: 'admin' },
    );
  });
});

describe('useRemoveMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends DELETE request', async () => {
    mockApiClient.delete.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useRemoveMember('proj-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate('m1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.delete).toHaveBeenCalledWith(
      '/projects/proj-1/members/m1',
    );
  });
});

describe('useAcceptInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST with token', async () => {
    const mockMember = { id: 'm3', role: 'member' };
    mockApiClient.post.mockResolvedValueOnce({ data: mockMember });

    const { result } = renderHook(
      () => useAcceptInvite(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('invite-token-abc');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/auth/accept-invite',
      { token: 'invite-token-abc' },
    );
  });
});
