import type { GoalPlanCreateRequest, GoalPlanResponse, GoalResponse, TokenResponse } from '@/types';

import { mockApiClient } from '../mock-api-client';

describe('Goal Plan mock contract', () => {
  const request: GoalPlanCreateRequest = {
    name: '영단어 외우기',
    triggerText: '아침 식사 후',
    schedule: { startDate: '2026-10-18', days: ['MO', 'WE', 'FR'] },
    standardAction: { text: '30개 외우기', targetAmount: '30개', estimatedMinutes: 20 },
    minimumAction: { text: '3개 읽기', estimatedMinutes: 1 },
  };
  async function createGoal() {
    return mockApiClient.post<GoalResponse>('/api/v1/goals', { title: '토익 900점' });
  }
  async function createPlan(goalId?: number) {
    return mockApiClient.post<GoalPlanResponse>('/api/v1/goal-plans', { ...request, goalId });
  }
  beforeEach(async () => {
    await mockApiClient.post('/api/v1/auth/guest');
  });

  it('supports independent and goal-specific plans; route goal overrides body goal', async () => {
    const goal = await createGoal();
    const independent = await createPlan();
    const linked = await mockApiClient.post<GoalPlanResponse>(`/api/v1/goals/${goal.id}/plans`, {
      ...request,
      goalId: -1,
    });
    expect(linked).toMatchObject({
      goalId: goal.id,
      schedule: { timeZone: 'Asia/Seoul', notifyAtTime: null },
    });
    expect(await mockApiClient.get('/api/v1/goal-plans', { query: { goalId: goal.id } })).toEqual([
      linked,
    ]);
    expect(
      await mockApiClient.get('/api/v1/goal-plans', {
        query: { independentOnly: true, goalId: -1 },
      }),
    ).toEqual([independent]);
  });

  it('does not leak plans across owners and transfers ownership on guest login merge', async () => {
    const goal = await createGoal();
    const plan = await createPlan(goal.id);
    const path = `/api/v1/goal-plans/${plan.id}`;
    const member = await mockApiClient.post<TokenResponse>('/api/v1/auth/login', {
      email: 'plan-merge@example.com',
      password: 'password123',
    });
    expect(member.user.accountType).toBe('REGISTERED');
    expect(await mockApiClient.get(path)).toEqual(plan);
    await mockApiClient.post('/api/v1/auth/guest');
    await expect(mockApiClient.get(path)).rejects.toMatchObject({ status: 404, code: 70002 });
    await expect(createPlan(goal.id)).rejects.toMatchObject({ status: 404, code: 70001 });
  });

  it('replaces content, permits detachment and leaves a failed update unchanged', async () => {
    const goal = await createGoal();
    const plan = await createPlan(goal.id);
    const path = `/api/v1/goal-plans/${plan.id}`;
    await expect(
      mockApiClient.patch(path, {
        ...request,
        schedule: { ...request.schedule, days: [] },
      }),
    ).rejects.toMatchObject({ status: 400, code: 10001 });
    expect(await mockApiClient.get(path)).toEqual(plan);
    expect(await mockApiClient.patch(path, { ...request, name: '단어 복습' })).toMatchObject({
      goalId: null,
      currentVersion: 2,
      name: '단어 복습',
    });
  });

  it('pauses plans by default on goal achievement and does not auto-resume on cancellation', async () => {
    const goal = await createGoal();
    const plan = await createPlan(goal.id);
    const path = `/api/v1/goal-plans/${plan.id}`;
    await mockApiClient.post(`/api/v1/goals/${goal.id}/achievement`);
    expect(await mockApiClient.get(path)).toMatchObject({ status: 'PAUSED', currentVersion: 1 });
    await mockApiClient.delete(`/api/v1/goals/${goal.id}/achievement`);
    expect(await mockApiClient.get(path)).toMatchObject({ status: 'PAUSED' });
    await mockApiClient.patch(`${path}/status`, { status: 'ACTIVE' });
    await mockApiClient.post(`/api/v1/goals/${goal.id}/achievement`, {
      futurePlanPolicy: 'KEEP_FUTURE',
    });
    expect(await mockApiClient.get(path)).toMatchObject({ status: 'ACTIVE' });
    await mockApiClient.patch(`${path}/status`, { status: 'ARCHIVED' });
    await mockApiClient.patch(`${path}/status`, { status: 'ACTIVE' });
    expect(await mockApiClient.get(path)).toMatchObject({ status: 'ARCHIVED' });
    await expect(mockApiClient.patch(path, request)).rejects.toMatchObject({ status: 400 });
  });

  it.each([
    { schedule: { ...request.schedule, timeZone: 'Invalid/Zone' } },
    { schedule: { ...request.schedule, notifyAtTime: '24:00' } },
    { minimumAction: { text: '읽기', estimatedMinutes: 0 } },
  ])('rejects unsupported schedule/action values without adding a plan: %j', async (patch) => {
    await expect(
      mockApiClient.post('/api/v1/goal-plans', { ...request, ...patch }),
    ).rejects.toMatchObject({ status: 400, code: 10001 });
    expect(await mockApiClient.get('/api/v1/goal-plans')).toEqual([]);
  });
});
