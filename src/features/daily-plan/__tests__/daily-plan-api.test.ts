import { dailyPlanApi } from '@/features/daily-plan/daily-plan-api';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;
const putMock = apiClient.put as jest.Mock;

describe('Daily Plan API', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
  });

  test('날짜별 계획과 결과 요약을 조회한다', async () => {
    await dailyPlanApi.get('2026-09-04');
    await dailyPlanApi.getSummary('2026-09-04');

    expect(getMock).toHaveBeenNthCalledWith(1, '/api/v1/daily-plans/2026-09-04', {
      signal: undefined,
    });
    expect(getMock).toHaveBeenNthCalledWith(2, '/api/v1/daily-plans/2026-09-04/summary', {
      signal: undefined,
    });
  });

  test('날짜별 계획을 전체 교체한다', async () => {
    const request = { focusTaskIds: [41, 17], status: 'CONFIRMED' as const };

    await dailyPlanApi.replace('2026-09-04', request);

    expect(putMock).toHaveBeenCalledWith('/api/v1/daily-plans/2026-09-04', request, {
      signal: undefined,
    });
  });
});
