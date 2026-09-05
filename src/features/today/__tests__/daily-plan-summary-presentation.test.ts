import type { DailyPlanSummaryResponse } from '@/types';

import {
  getDailyPlanSummaryAccessibilityLabel,
  getDailyPlanSummaryItems,
  shouldShowDailyPlanSummary,
} from '../daily-plan-summary-presentation';

const summary: DailyPlanSummaryResponse = {
  date: '2026-09-05',
  status: 'CONFIRMED',
  plannedFocusCount: 3,
  completedCount: 1,
  movedToOtherDateCount: 0,
  movedToInboxCount: 1,
  undecidedCount: 1,
};

describe('daily plan summary presentation', () => {
  test('계획 확정 시점 focus 결과를 네 가지 상태로 표시한다', () => {
    expect(getDailyPlanSummaryItems(summary)).toEqual([
      { key: 'completed', label: '완료', count: 1, tone: 'success' },
      { key: 'otherDate', label: '다른 날짜', count: 0, tone: 'primary' },
      { key: 'inbox', label: '기록함', count: 1, tone: 'warning' },
      { key: 'undecided', label: '미결정', count: 1, tone: 'muted' },
    ]);
    expect(getDailyPlanSummaryAccessibilityLabel(summary)).toBe(
      '오늘 계획 결과, 집중 3개, 완료 1개, 다른 날짜 0개, 기록함 1개, 미결정 1개',
    );
  });

  test('비어 있는 초안은 숨기고 확정된 빈 계획은 결과로 인정한다', () => {
    expect(
      shouldShowDailyPlanSummary({
        ...summary,
        status: 'DRAFT',
        plannedFocusCount: 0,
      }),
    ).toBe(false);
    expect(
      shouldShowDailyPlanSummary({
        ...summary,
        plannedFocusCount: 0,
      }),
    ).toBe(true);
  });
});
