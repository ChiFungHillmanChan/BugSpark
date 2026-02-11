import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAnalyzeReport } from '@/hooks/use-analysis';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
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

describe('useAnalyzeReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST to analyze endpoint', async () => {
    const mockAnalysis = {
      summary: 'Test summary',
      suggestedCategory: 'bug',
      suggestedSeverity: 'high',
      reproductionSteps: ['Step 1', 'Step 2'],
      rootCause: 'Test root cause',
      fixSuggestions: ['Fix 1'],
      affectedArea: 'auth',
    };
    mockApiClient.post.mockResolvedValueOnce({ data: mockAnalysis });

    const { result } = renderHook(
      () => useAnalyzeReport(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('report-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.post).toHaveBeenCalledWith('/reports/report-123/analyze');
    expect(result.current.data).toEqual(mockAnalysis);
  });

  it('handles analysis failure', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(
      () => useAnalyzeReport(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('report-456');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
