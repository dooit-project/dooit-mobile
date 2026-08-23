import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { taskApi, taskQueryKeys } from '@/features/tasks';
import type { LocalDateString } from '@/types';

import { separateTodayReviewItems } from './today-review-items';

export function useTodayOverview(date: LocalDateString) {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';
  const todayQuery = useQuery({
    queryKey: taskQueryKeys.today(date),
    queryFn: ({ signal }) => taskApi.getToday(date, signal),
    enabled: canFetch,
  });
  const recommendationsQuery = useQuery({
    queryKey: taskQueryKeys.todayRecommendations(date),
    queryFn: ({ signal }) => taskApi.getTodayRecommendations(date, signal),
    enabled: canFetch,
  });
  const doneQuery = useQuery({
    queryKey: taskQueryKeys.done(date),
    queryFn: ({ signal }) => taskApi.getDone(date, signal),
    enabled: canFetch,
  });
  const staleQuery = useQuery({
    queryKey: taskQueryKeys.stale(),
    queryFn: ({ signal }) => taskApi.getStale(signal),
    enabled: canFetch,
  });
  const inboxQuery = useQuery({
    queryKey: taskQueryKeys.inbox(),
    queryFn: ({ signal }) => taskApi.getInbox(signal),
    enabled: canFetch,
  });
  const coreQueries = [todayQuery, doneQuery, inboxQuery];
  const supplementalQueries = [staleQuery, recommendationsQuery];
  const queries = [...coreQueries, ...supplementalQueries];
  const reviewItems = separateTodayReviewItems(
    recommendationsQuery.data ?? [],
    inboxQuery.data ?? [],
  );

  return {
    todayTasks: todayQuery.data ?? [],
    recommendations: reviewItems.recommendations,
    doneTasks: doneQuery.data ?? [],
    staleTasks: staleQuery.data ?? [],
    inboxTasks: reviewItems.inboxTasks,
    isPending: coreQueries.some((query) => query.isPending),
    isRefreshing: queries.some((query) => query.isFetching),
    error: coreQueries.find((query) => query.error)?.error ?? null,
    supplementalError: supplementalQueries.find((query) => query.error)?.error ?? null,
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
