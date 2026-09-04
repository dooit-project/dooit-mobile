import type { LocalDateString, TaskListQuery, TaskSearchQuery } from '@/types';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  detail: (taskId: number) => [...taskQueryKeys.all, 'detail', taskId] as const,
  categories: () => [...taskQueryKeys.all, 'categories'] as const,
  checklist: (taskId: number) => [...taskQueryKeys.detail(taskId), 'checklist'] as const,
  list: (query: TaskListQuery) => [...taskQueryKeys.all, 'list', query] as const,
  search: (query: TaskSearchQuery) => [...taskQueryKeys.all, 'search', query] as const,
  today: (date: LocalDateString) => [...taskQueryKeys.all, 'today', date] as const,
  todayRecommendations: (date: LocalDateString) =>
    [...taskQueryKeys.all, 'today-recommendations', date] as const,
  done: (date: LocalDateString) => [...taskQueryKeys.all, 'done', date] as const,
  stale: () => [...taskQueryKeys.all, 'stale'] as const,
  inbox: () => [...taskQueryKeys.all, 'inbox'] as const,
};
