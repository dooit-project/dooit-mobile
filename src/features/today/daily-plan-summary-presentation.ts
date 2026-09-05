import type { DailyPlanSummaryResponse } from '@/types';

export type DailyPlanSummaryTone = 'success' | 'primary' | 'warning' | 'muted';

export type DailyPlanSummaryItem = {
  key: 'completed' | 'otherDate' | 'inbox' | 'undecided';
  label: string;
  count: number;
  tone: DailyPlanSummaryTone;
};

export function shouldShowDailyPlanSummary(summary: DailyPlanSummaryResponse) {
  return summary.status !== 'DRAFT' || summary.plannedFocusCount > 0;
}

export function getDailyPlanSummaryItems(
  summary: DailyPlanSummaryResponse,
): DailyPlanSummaryItem[] {
  return [
    {
      key: 'completed',
      label: '완료',
      count: summary.completedCount,
      tone: 'success',
    },
    {
      key: 'otherDate',
      label: '다른 날짜',
      count: summary.movedToOtherDateCount,
      tone: 'primary',
    },
    {
      key: 'inbox',
      label: '기록함',
      count: summary.movedToInboxCount,
      tone: 'warning',
    },
    {
      key: 'undecided',
      label: '미결정',
      count: summary.undecidedCount,
      tone: 'muted',
    },
  ];
}

export function getDailyPlanSummaryAccessibilityLabel(summary: DailyPlanSummaryResponse) {
  return [
    `오늘 계획 결과, 집중 ${summary.plannedFocusCount}개`,
    `완료 ${summary.completedCount}개`,
    `다른 날짜 ${summary.movedToOtherDateCount}개`,
    `기록함 ${summary.movedToInboxCount}개`,
    `미결정 ${summary.undecidedCount}개`,
  ].join(', ');
}
