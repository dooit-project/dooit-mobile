import { dailyPlanQueryKeys } from '@/features/daily-plan/daily-plan-query-keys';

describe('Daily Plan query keys', () => {
  test('날짜별 plan과 summary cache를 분리한다', () => {
    expect(dailyPlanQueryKeys.detail('2026-09-04')).toEqual([
      'daily-plans',
      'detail',
      '2026-09-04',
    ]);
    expect(dailyPlanQueryKeys.summary('2026-09-04')).toEqual([
      'daily-plans',
      'detail',
      '2026-09-04',
      'summary',
    ]);
  });
});
