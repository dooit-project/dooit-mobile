import { useQueries } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { GoalJourneyItem, GoalJourneyQuery } from '@/types';
import { APP_TIME_ZONE } from '@/utils';

import { goalJourneyApi } from './goal-journey-api';
import { goalJourneyQueryKeys } from './goal-journey-query-keys';

type WeekRange = Pick<GoalJourneyQuery, 'from' | 'to'>;

/** A partial page is not a complete week. Never mix pages from different snapshots. */
export async function loadGoalWeekJourney(
  goalId: number,
  range: WeekRange,
  signal?: AbortSignal,
): Promise<GoalJourneyItem[]> {
  const items: GoalJourneyItem[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  let version: string | undefined;
  do {
    const page = await goalJourneyApi.get(
      goalId,
      { ...range, timeZone: APP_TIME_ZONE, limit: 100, ...(cursor ? { cursor } : {}) },
      signal,
    );
    if (version !== undefined && page.journeyVersion !== version) {
      throw new Error('기록이 변경되었어요. 다시 불러와 주세요.');
    }
    version = page.journeyVersion;
    items.push(...page.items);
    cursor = page.nextCursor ?? undefined;
    if (cursor && cursors.has(cursor)) throw new Error('기록을 모두 불러오지 못했어요.');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return items;
}

/** The caller must distinguish an incomplete/error result from an empty week. */
export function useGoalWeekJourneys(goalIds: number[], range: WeekRange) {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';
  const ids = [...new Set(goalIds)];
  const queries = useQueries({
    queries: ids.map((goalId) => ({
      queryKey: [...goalJourneyQueryKeys.goal(goalId), 'complete-week', range, APP_TIME_ZONE],
      queryFn: ({ signal }: { signal: AbortSignal }) => loadGoalWeekJourney(goalId, range, signal),
      enabled: canFetch,
      retry: false,
    })),
  });
  return {
    journeys: queries.flatMap((query) => query.data ?? []),
    isPending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error ?? null,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
