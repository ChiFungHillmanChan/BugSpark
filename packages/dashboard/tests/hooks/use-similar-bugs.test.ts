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

import { useSimilarBugs } from '@/hooks/use-similar-bugs';

describe('useSimilarBugs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches similar bugs for a report ID', async () => {
    const mockResponse = {
      similarBugs: [
        { id: 'bug-2', title: 'Similar crash', similarity: 0.85 },
      ],
    };
    mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(
      () => useSimilarBugs('bug-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/reports/bug-1/similar');
    expect(result.current.data).toEqual(mockResponse);
  });

  it('is disabled when reportId is empty string', () => {
    const { result } = renderHook(
      () => useSimilarBugs(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});
