import { mockApiClient } from '@/services/api/mock-api-client';
import type { DailyPlanResponse, DailyPlanSummaryResponse, TaskResponse } from '@/types';

describe('Mock Daily Plan API', () => {
  test('빈 계획을 반환하고 확정 시점 focus 기준 요약을 유지한다', async () => {
    const date = '2026-09-04';
    const empty = await mockApiClient.get<DailyPlanResponse>(`/api/v1/daily-plans/${date}`);
    expect(empty).toMatchObject({ date, status: 'DRAFT', focusTaskIds: [] });

    const first = await mockApiClient.post<TaskResponse>('/api/v1/tasks', {
      title: '첫 작업',
      type: 'SCHEDULE',
      startAt: `${date}T09:00:00`,
      endAt: `${date}T10:00:00`,
      allDay: false,
    });
    const second = await mockApiClient.post<TaskResponse>('/api/v1/tasks', {
      title: '두 번째 작업',
      type: 'SCHEDULE',
      startAt: `${date}T11:00:00`,
      endAt: `${date}T12:00:00`,
      allDay: false,
    });

    await mockApiClient.put(`/api/v1/daily-plans/${date}`, {
      focusTaskIds: [first.id, second.id],
      status: 'CONFIRMED',
    });
    await mockApiClient.patch(`/api/v1/tasks/${first.id}/done`, undefined, {
      query: { date },
    });
    await mockApiClient.patch(`/api/v1/tasks/${second.id}/inbox`);

    const summary = await mockApiClient.get<DailyPlanSummaryResponse>(
      `/api/v1/daily-plans/${date}/summary`,
    );
    expect(summary).toMatchObject({
      status: 'CONFIRMED',
      plannedFocusCount: 2,
      completedCount: 1,
      movedToInboxCount: 1,
      undecidedCount: 0,
    });
  });
});
