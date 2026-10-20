import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { dailyPlanQueryKeys } from '@/features/daily-plan/daily-plan-query-keys';
import { taskQueryKeys } from '@/features/tasks/task-query-keys';
import { getAccessToken } from '@/services/api';
import type { LocalDateString } from '@/types';

import { changeGoalOccurrence } from './goal-occurrence-change';
import { goalOccurrenceApi } from './goal-occurrence-api';
import { goalJourneyQueryKeys } from './goal-journey-query-keys';
import { goalOccurrenceQueryKeys } from './goal-plan-query-keys';

function owner(client: QueryClient) {
  return client.getQueryData<{ id: number }>(['auth', 'me'])?.id;
}
function sameOwner(client: QueryClient, id: number | undefined) {
  return id !== undefined && owner(client) === id && Boolean(getAccessToken());
}

/** GET materializes linked Tasks. Refresh their caches only after that GET finishes. */
export function todayGoalOccurrenceOptions(client: QueryClient, date: LocalDateString) {
  return {
    queryKey: goalOccurrenceQueryKeys.list({ from: date, to: date }),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const ownerId = owner(client);
      const rows = await goalOccurrenceApi.list({ from: date, to: date }, signal);
      if (!signal.aborted && sameOwner(client, ownerId)) {
        await Promise.all([
          client.invalidateQueries({ queryKey: taskQueryKeys.all }),
          client.invalidateQueries({ queryKey: dailyPlanQueryKeys.all }),
        ]);
      }
      return rows;
    },
  };
}

export function useTodayGoalOccurrences(date: LocalDateString) {
  const client = useQueryClient();
  return useQuery({
    ...todayGoalOccurrenceOptions(client, date),
    enabled: Platform.OS !== 'web' || typeof window !== 'undefined',
  });
}

export function useChangeGoalOccurrence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: changeGoalOccurrence,
    retry: false,
    onMutate: async () => {
      const ownerId = owner(client);
      await client.cancelQueries({ queryKey: goalOccurrenceQueryKeys.all });
      return { ownerId };
    },
    // A failed response can still have reached the server. Refresh, but never replay the mutation.
    onSettled: async (_data, _error, _change, context) => {
      if (!sameOwner(client, context?.ownerId)) return;
      // Materialize first, then re-read Tasks so a later GET cannot restore an obsolete list.
      await client.invalidateQueries({ queryKey: goalOccurrenceQueryKeys.all });
      if (!sameOwner(client, context?.ownerId)) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: taskQueryKeys.all }),
        client.invalidateQueries({ queryKey: dailyPlanQueryKeys.all }),
        client.invalidateQueries({ queryKey: goalJourneyQueryKeys.all }),
      ]);
    },
  });
}
