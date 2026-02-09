import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/lib/query-keys';

describe('queryKeys', () => {
  describe('bugs', () => {
    it('all returns correct key', () => {
      expect(queryKeys.bugs.all).toEqual(['bugs']);
    });

    it('list includes filters', () => {
      const filters = { search: 'crash', status: ['new' as const] };
      expect(queryKeys.bugs.list(filters)).toEqual(['bugs', 'list', filters]);
    });

    it('detail includes id', () => {
      expect(queryKeys.bugs.detail('bug-123')).toEqual(['bugs', 'detail', 'bug-123']);
    });
  });

  describe('projects', () => {
    it('all returns correct key', () => {
      expect(queryKeys.projects.all).toEqual(['projects']);
    });

    it('detail includes id', () => {
      expect(queryKeys.projects.detail('proj-1')).toEqual(['projects', 'detail', 'proj-1']);
    });
  });

  describe('stats', () => {
    it('overview returns correct key', () => {
      expect(queryKeys.stats.overview).toEqual(['stats', 'overview']);
    });

    it('project includes id', () => {
      expect(queryKeys.stats.project('proj-1')).toEqual(['stats', 'project', 'proj-1']);
    });
  });

  describe('comments', () => {
    it('list includes reportId', () => {
      expect(queryKeys.comments.list('report-42')).toEqual(['comments', 'report-42']);
    });
  });
});
