import { useQueries } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { taskApi, taskQueryKeys } from '@/features/tasks';
import type { LocalDateString } from '@/types';

import { getCalendarMonthStarts } from './calendar-date';
import { dedupeCalendarDayTasks } from './calendar-day-query';

export function useCalendarVisibleTasks(dates: LocalDateString[]) {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';
  const months = getCalendarMonthStarts(dates);
  const queries = useQueries({
    queries: months.map((date) => ({
      queryKey: taskQueryKeys.list({ type: 'MONTH', date }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        taskApi.list({ type: 'MONTH', date }, signal),
      enabled: canFetch,
    })),
  });
  const isPending = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error ?? null;

  return {
    // Never present a partial month response as the whole visible grid's records.
    data:
      isPending || error
        ? undefined
        : dedupeCalendarDayTasks(queries.flatMap((query) => query.data ?? [])),
    isPending,
    isFetching: queries.some((query) => query.isFetching),
    error,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
