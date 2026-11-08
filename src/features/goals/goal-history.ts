import type { GoalJourneyItem, GoalJourneyResponse, LocalDateString, TaskResponse } from '@/types';
import { APP_TIME_ZONE, isLocalDateString } from '@/utils';

import { goalJourneyApi } from './goal-journey-api';

export type HistoryRow = {
  key: string;
  title: string;
  detail: string | null;
  date: LocalDateString | null;
  taskId: number | null;
};

export type HistoryPageParam = { cursor: string | null; version: string | null; used: string[] };

/** The server cursor is range- and snapshot-specific; never merge incompatible pages. */
export async function fetchHistoryPage(
  goalId: number,
  to: LocalDateString,
  page: HistoryPageParam,
  signal?: AbortSignal,
): Promise<GoalJourneyResponse> {
  const response = await goalJourneyApi.get(
    goalId,
    {
      from: '0100-01-01',
      to,
      timeZone: APP_TIME_ZONE,
      limit: 20,
      ...(page.cursor ? { cursor: page.cursor } : {}),
    },
    signal,
  );
  if (page.version && page.version !== response.journeyVersion)
    throw new Error('기록이 변경되었어요. 다시 불러와 주세요.');
  if (response.nextCursor && [...page.used, page.cursor].includes(response.nextCursor))
    throw new Error('기록을 모두 불러오지 못했어요. 다시 불러와 주세요.');
  return response;
}

export function goalHistoryRows(pages: GoalJourneyResponse[]): HistoryRow[] {
  const seen = new Set<string>();
  const occurrenceTasks = new Set(
    pages.flatMap((page) =>
      page.items.flatMap((item) =>
        item.sourceType === 'PLAN_OCCURRENCE' && item.taskId !== null ? [item.taskId] : [],
      ),
    ),
  );
  return pages.flatMap((page) =>
    page.items.flatMap((item: GoalJourneyItem) => {
      const key = `${item.sourceType}:${item.sourceId}`;
      if (
        seen.has(key) ||
        (item.sourceType === 'TASK_COMPLETION' &&
          item.taskId !== null &&
          occurrenceTasks.has(item.taskId))
      )
        return [];
      seen.add(key);
      const unknown = item.sourceType === 'PLAN_OCCURRENCE' && item.actionVariant === 'UNKNOWN';
      return [
        {
          key,
          title: unknown ? item.title : item.actionText?.trim() || item.title,
          detail: unknown ? '반복 계획 · 실천 내용 미확인' : null,
          date: item.practicedDate,
          taskId: item.sourceType === 'TASK_COMPLETION' ? item.taskId : null,
        },
      ];
    }),
  );
}

/** Missing completion dates stay visibly unknown; scheduled dates are not completion dates. */
export function legacyHistoryRows(tasks: TaskResponse[]): HistoryRow[] {
  return tasks
    .filter((task) => task.status === 'DONE' && task.recurrenceException !== 'SKIPPED')
    .map((task) => {
      const date = task.completedAt?.slice(0, 10);
      return {
        key: `task:${task.id}`,
        title: task.title,
        detail: null,
        date: date && isLocalDateString(date) ? date : null,
        taskId: task.id,
      };
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.key.localeCompare(b.key));
}
