import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { taskApi } from '@/features/tasks';
import type { LocalDateString } from '@/types';

import { dedupeCalendarDayTasks, getCalendarDayQueryKeys } from './calendar-day-query';

export function useCalendarDayTasks(date: LocalDateString) {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';
  const queryKeys = getCalendarDayQueryKeys(date);
  const scheduledQuery = useQuery({
    queryKey: queryKeys.scheduled,
    queryFn: ({ signal }) => taskApi.getToday(date, signal),
    enabled: canFetch,
  });
  const doneQuery = useQuery({
    queryKey: queryKeys.done,
    queryFn: ({ signal }) => taskApi.getDone(date, signal),
    enabled: canFetch,
  });
  const queries = [scheduledQuery, doneQuery];

  return {
    scheduledTasks: dedupeCalendarDayTasks(scheduledQuery.data ?? []),
    doneTasks: dedupeCalendarDayTasks(doneQuery.data ?? []),
    isPending: queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    error: queries.find((query) => query.error)?.error ?? null,
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
