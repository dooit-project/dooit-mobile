import type { GuestMergeResultResponse } from '@/types';

export type GuestMergeRouteParams = {
  linked: '1';
  linkedTasks?: string;
  linkedSchedules?: string;
  linkedDdayGoals?: string;
  linkedRecurrenceSeries?: string;
};

function parseCount(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function createGuestMergeRouteParams(
  result: GuestMergeResultResponse | null,
): GuestMergeRouteParams {
  if (!result) {
    return { linked: '1' };
  }

  return {
    linked: '1',
    linkedTasks: String(result.tasks),
    linkedSchedules: String(result.schedules),
    linkedDdayGoals: String(result.ddayGoals),
    linkedRecurrenceSeries: String(result.recurrenceSeries),
  };
}

export function getGuestMergeNoticeMessage(params: {
  linkedTasks?: string | string[];
  linkedSchedules?: string | string[];
  linkedDdayGoals?: string | string[];
  linkedRecurrenceSeries?: string | string[];
}) {
  const counts = [
    ['할 일', parseCount(params.linkedTasks)],
    ['일정', parseCount(params.linkedSchedules)],
    ['D-Day', parseCount(params.linkedDdayGoals)],
    ['반복 항목', parseCount(params.linkedRecurrenceSeries)],
  ] as const;
  const summaries = counts
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `${label} ${count}개`);

  return summaries.length > 0
    ? `${summaries.join(', ')}를 계정에 안전하게 연결했어요.`
    : '게스트로 작성한 내용을 계정에 안전하게 연결했어요.';
}
