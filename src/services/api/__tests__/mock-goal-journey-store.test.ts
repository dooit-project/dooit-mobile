import type {
  GoalJourneyResponse,
  GoalPlanOccurrenceResponse,
  GoalResponse,
  TaskResponse,
} from '@/types';

import { mockApiClient } from '../mock-api-client';

const DAY = '2026-10-18';
describe('Goal journey and one-off Task integration', () => {
  let goal: GoalResponse;
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-18T03:00:00Z'));
    await mockApiClient.post('/api/v1/auth/guest');
    goal = await mockApiClient.post<GoalResponse>('/api/v1/goals', { title: '토익 900점' });
  });
  afterEach(() => jest.useRealTimers());
  function journey(query: Record<string, string | number> = {}) {
    return mockApiClient.get<GoalJourneyResponse>(`/api/v1/goals/${goal.id}/journey`, {
      query: { from: DAY, to: '2026-10-20', ...query },
    });
  }
  async function direct(key: string) {
    return mockApiClient.post(
      `/api/v1/goals/${goal.id}/direct-logs`,
      { practicedDate: DAY, title: key },
      { idempotencyKey: key },
    );
  }
  async function occurrences() {
    await mockApiClient.post('/api/v1/goal-plans', {
      goalId: goal.id,
      name: '단어 복습',
      schedule: { startDate: DAY, days: ['SU', 'MO', 'TU'] },
      standardAction: { text: '30개 외우기' },
      minimumAction: { text: '3개 읽기' },
      nextAction: '지난 단어부터',
    });
    return () =>
      mockApiClient.get<GoalPlanOccurrenceResponse[]>('/api/v1/goal-plan-occurrences', {
        query: { from: DAY, to: '2026-10-20' },
      });
  }
  async function oneOff() {
    const task = await mockApiClient.post<TaskResponse>(`/api/v1/goals/${goal.id}/tasks`, {
      title: '문제 30개',
      date: DAY,
    });
    await mockApiClient.patch(`/api/v1/tasks/${task.id}/done`, undefined, { query: { date: DAY } });
    return task;
  }

  it('reads without materialization and returns full-range counts on every page without duplicate Tasks', async () => {
    const list = await occurrences();
    expect((await journey()).summary.noRecordOccurrenceCount).toBe(0);
    const rows = await list();
    await mockApiClient.put(`/api/v1/goal-plan-occurrences/${rows[0].id}/result`, {
      actionVariant: 'MINIMUM',
      practicedAt: `${DAY}T12:00:00`,
      nextActionPatchKind: 'CLEAR',
    });
    await mockApiClient.put(`/api/v1/goal-plan-occurrences/${rows[1].id}/rest`);
    await oneOff();
    await direct('문제 풀이 기록');
    const before = await list();
    const first = await journey({ limit: 1 });
    expect(first.summary).toEqual({
      practiceOccurrenceCount: 1,
      oneOffCompletionCount: 1,
      directLogCount: 1,
      practiceDateCount: 1,
      standardCount: 0,
      minimumCount: 1,
      unknownCount: 2,
      restCount: 1,
      noRecordOccurrenceCount: 1,
    });
    expect(first.items).toHaveLength(1);
    const second = await journey({ limit: 2, cursor: first.nextCursor! });
    expect(second.summary).toEqual(first.summary);
    expect(second.journeyVersion).toBe(first.journeyVersion);
    expect([...first.items, ...second.items].map((item) => item.sourceType)).toEqual([
      'DIRECT_LOG',
      'PLAN_OCCURRENCE',
      'TASK_COMPLETION',
    ]);
    expect(second.items[0]).toMatchObject({ actionText: '3개 읽기', nextAction: null });
    expect(second.nextCursor).toBeNull();
    expect(await list()).toEqual(before);
    expect((await journey({ from: '2026-01-01', to: '2026-12-31' })).summary.directLogCount).toBe(
      1,
    );
  });

  it('rejects changed cursor scope and changed source version but permits a fresh first page', async () => {
    await direct('첫 기록');
    await direct('둘째 기록');
    const page = await journey({ limit: 1 });
    await expect(journey({ cursor: page.nextCursor!, timeZone: 'UTC' })).rejects.toMatchObject({
      status: 400,
      code: 10001,
    });
    await direct('셋째 기록');
    await expect(journey({ cursor: page.nextCursor! })).rejects.toMatchObject({
      status: 409,
      code: 70008,
    });
    expect((await journey()).summary.directLogCount).toBe(3);
    await expect(journey({ cursor: 'invalid' })).rejects.toMatchObject({ status: 400 });
  });

  it('converts timestamp records to query timezone, keeps direct dates, excludes canceled/reopened records', async () => {
    const list = await occurrences();
    const [o] = await list();
    await mockApiClient.put(`/api/v1/goal-plan-occurrences/${o.id}/result`, {
      actionVariant: 'STANDARD',
      practicedAt: `${DAY}T01:00:00`,
      practicedTimeZone: 'Asia/Seoul',
    });
    const task = await oneOff();
    await direct('직접 기록');
    const range = { from: '2026-10-17', to: DAY, timeZone: 'America/New_York' };
    const result = await journey(range);
    expect(result.items.find((i) => i.sourceType === 'DIRECT_LOG')?.practicedDate).toBe(DAY);
    expect(result.items.find((i) => i.sourceType === 'PLAN_OCCURRENCE')?.practicedDate).toBe(
      '2026-10-17',
    );
    await mockApiClient.patch(`/api/v1/tasks/${task.id}/done/cancel`, undefined, {
      query: { date: DAY },
    });
    await mockApiClient.delete(`/api/v1/goal-plan-occurrences/${o.id}/result`);
    expect((await journey(range)).summary).toMatchObject({
      practiceOccurrenceCount: 0,
      oneOffCompletionCount: 0,
      directLogCount: 1,
    });
    const log = (await journey()).items.find((i) => i.sourceType === 'DIRECT_LOG')!;
    await mockApiClient.delete(`/api/v1/goal-direct-logs/${log.sourceId}`);
    expect((await journey()).items).toEqual([]);
  });

  it('keeps Goal/D-Day and completion independent, preserves null updates and rejects recurring links atomically', async () => {
    const task = await oneOff();
    const dday = await mockApiClient.post<{ id: number }>('/api/v1/dday-goals', {
      title: '시험일',
      targetDate: '2026-12-01',
    });
    await mockApiClient.patch(`/api/v1/tasks/${task.id}/dday-goal`, undefined, {
      query: { ddayGoalId: dday.id },
    });
    const unlinked = await mockApiClient.delete<TaskResponse>(`/api/v1/tasks/${task.id}/goal-link`);
    expect(unlinked).toMatchObject({ status: 'DONE', ddayGoalId: dday.id, linkedGoalId: null });
    await mockApiClient.put(`/api/v1/tasks/${task.id}/goal-link`, { goalId: goal.id });
    expect(
      await mockApiClient.put(`/api/v1/tasks/${task.id}`, {
        title: '오답 복습',
        allDay: false,
        linkedGoalId: null,
      }),
    ).toMatchObject({ linkedGoalId: goal.id, ddayGoalId: dday.id, status: 'DONE' });
    const list = await occurrences();
    const [o] = await list();
    await expect(
      mockApiClient.put(`/api/v1/tasks/${o.linkedTaskId}/goal-link`, { goalId: goal.id }),
    ).rejects.toMatchObject({ status: 409, code: 70005 });
    await expect(
      mockApiClient.put(`/api/v1/tasks/${task.id}`, {
        title: '바뀌면 안 됨',
        allDay: false,
        linkedGoalId: goal.id,
        recurrence: { frequency: 'WEEKLY' },
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(await mockApiClient.get(`/api/v1/tasks/${task.id}`)).toMatchObject({
      title: '오답 복습',
      linkedGoalId: goal.id,
    });
  });

  it('isolates Goal Task/journey access across owner merge and rejects old owner cursor scope', async () => {
    const task = await oneOff();
    await direct('기록');
    const page = await journey({ limit: 1 });
    await mockApiClient.post('/api/v1/auth/login', {
      email: 'journey-owner@example.com',
      password: 'password123',
    });
    expect((await journey()).summary.oneOffCompletionCount).toBe(1);
    await expect(journey({ cursor: page.nextCursor! })).rejects.toMatchObject({ status: 400 });
    await mockApiClient.post('/api/v1/auth/guest');
    await expect(journey()).rejects.toMatchObject({ status: 404, code: 70001 });
    await expect(
      mockApiClient.put(`/api/v1/tasks/${task.id}/goal-link`, { goalId: goal.id }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
