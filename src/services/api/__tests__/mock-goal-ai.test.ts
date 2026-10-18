import type { GoalResponse } from '@/types';

import { mockApiClient } from '../mock-api-client';

describe('Disabled Goal AI mock', () => {
  it('returns 503 without generating/saving suggestions and preserves manual CRUD/raw journey', async () => {
    await mockApiClient.post('/api/v1/auth/guest');
    const goal = await mockApiClient.post<GoalResponse>('/api/v1/goals', { title: '토익 900점' });
    await expect(
      mockApiClient.post('/api/v1/goals/draft', { description: '배우고 싶어요' }),
    ).rejects.toMatchObject({ status: 503, code: 70009 });
    await expect(
      mockApiClient.post(`/api/v1/goals/${goal.id}/plan-draft`, {
        description: '작게 시작하기',
        schedule: { startDate: '2026-10-18', days: ['MO'] },
      }),
    ).rejects.toMatchObject({ status: 503, code: 70009 });
    await expect(
      mockApiClient.post(`/api/v1/goals/${goal.id}/journey-summary`, {
        from: '2026-10-18',
        to: '2026-10-24',
      }),
    ).rejects.toMatchObject({ status: 503, code: 70009 });
    expect(await mockApiClient.get('/api/v1/goals')).toEqual([goal]);
    expect(await mockApiClient.get('/api/v1/goal-plans')).toEqual([]);
    expect(
      await mockApiClient.get(`/api/v1/goals/${goal.id}/journey`, {
        query: { from: '2026-10-18', to: '2026-10-24' },
      }),
    ).toMatchObject({ items: [], summary: { directLogCount: 0 } });
    await mockApiClient.post('/api/v1/auth/guest');
    await expect(
      mockApiClient.post(`/api/v1/goals/${goal.id}/plan-draft`, {}),
    ).rejects.toMatchObject({ status: 404, code: 70001 });
  });
});
