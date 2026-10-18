import type {
  DailyPlanResponse,
  GoalPlanCreateRequest,
  GoalPlanOccurrenceResponse,
  GoalPlanResponse,
  GoalPracticeResultResponse,
  GoalResponse,
  TaskResponse,
  TokenResponse,
} from '@/types';

import { mockApiClient } from '../mock-api-client';

const PATH = '/api/v1/goal-plan-occurrences';
const TODAY = '2026-10-18';
const allDays: GoalPlanCreateRequest['schedule']['days'] = [
  'MO',
  'TU',
  'WE',
  'TH',
  'FR',
  'SA',
  'SU',
];

describe('Goal occurrence and Task integration', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-18T03:00:00Z'));
    await mockApiClient.post('/api/v1/auth/guest');
  });
  afterEach(() => jest.useRealTimers());

  function list(from = TODAY, to = TODAY, goalId?: number) {
    return mockApiClient.get<GoalPlanOccurrenceResponse[]>(PATH, { query: { from, to, goalId } });
  }
  async function setup(patch: Partial<GoalPlanCreateRequest> = {}) {
    const goal = await mockApiClient.post<GoalResponse>('/api/v1/goals', { title: '토익 900점' });
    const request: GoalPlanCreateRequest = {
      goalId: goal.id,
      name: '단어 복습',
      schedule: { startDate: '2026-10-17', days: allDays, notifyAtTime: '20:00' },
      standardAction: { text: '30개 외우기' },
      minimumAction: { text: '3개 읽기' },
      ...patch,
    };
    const plan = await mockApiClient.post<GoalPlanResponse>('/api/v1/goal-plans', request);
    return { goal, plan, request };
  }
  function task(id: number) {
    return mockApiClient.get<TaskResponse>(`/api/v1/tasks/${id}`);
  }

  it('materializes inclusive ranges once, omits Tasks for past dates and avoids Task notifications', async () => {
    await setup();
    const rows = await list('2026-10-17', '2026-10-19');
    expect(rows).toHaveLength(3);
    expect(rows[0].linkedTaskId).toBeNull();
    expect(rows[1]).toMatchObject({
      notificationKey: `goal-plan:${rows[1].planId}:${TODAY}`,
      scheduledNotificationAt: `${TODAY}T20:00:00`,
    });
    expect(await list('2026-10-17', '2026-10-19')).toEqual(rows);
    expect(await task(rows[1].linkedTaskId!)).toMatchObject({
      type: 'TODO',
      status: 'TODAY',
      plannedDate: TODAY,
      targetDate: TODAY,
      unscheduled: true,
      title: '3개 읽기',
      notificationEnabled: false,
      notifyAt: null,
    });
    expect(
      await mockApiClient.get('/api/v1/tasks/notification-candidates', {
        query: { from: TODAY, to: '2026-10-19' },
      }),
    ).toEqual([]);
    await expect(list(TODAY, '2026-11-18')).rejects.toMatchObject({ status: 400, code: 10001 });
    await expect(list('2026-10-19', TODAY)).rejects.toMatchObject({ status: 400 });
    expect(await list(TODAY, '2026-11-17')).toHaveLength(31);
  });

  it('completes the Task/checklist, removes focus and preserves explicit MINIMUM on repeated Task checks', async () => {
    await setup();
    const [occurrence] = await list();
    const taskId = occurrence.linkedTaskId!;
    await mockApiClient.post(`/api/v1/tasks/${taskId}/checklist-items`, { title: '3개 읽기' });
    await mockApiClient.put(`/api/v1/daily-plans/${TODAY}`, {
      status: 'CONFIRMED',
      focusTaskIds: [taskId],
    });
    const result = await mockApiClient.put<GoalPracticeResultResponse>(
      `${PATH}/${occurrence.id}/result`,
      {
        actionVariant: 'MINIMUM',
        practicedAt: `${TODAY}T12:20:00`,
        occurrenceVersion: occurrence.occurrenceVersion,
        accomplishedNote: '3개를 읽었어요',
        nextActionPatchKind: 'REPLACE',
        nextAction: '어제 단어 복습',
      },
    );
    expect(result.actionVariant).toBe('MINIMUM');
    expect(await task(taskId)).toMatchObject({ status: 'DONE', completedAt: `${TODAY}T12:20:00` });
    expect(
      await mockApiClient.get<DailyPlanResponse>(`/api/v1/daily-plans/${TODAY}`),
    ).toMatchObject({ focusTaskIds: [] });
    expect(await mockApiClient.get(`/api/v1/tasks/${taskId}/checklist-items`)).toEqual([
      expect.objectContaining({ done: true, completedAt: `${TODAY}T12:20:00` }),
    ]);
    await mockApiClient.patch(`/api/v1/tasks/${taskId}/done`);
    expect((await list())[0].result).toMatchObject({
      actionVariant: 'MINIMUM',
      practicedAt: `${TODAY}T12:20:00`,
      nextAction: '어제 단어 복습',
    });
    await expect(mockApiClient.put(`${PATH}/${occurrence.id}/rest`)).rejects.toMatchObject({
      status: 409,
      code: 70004,
    });
    await expect(
      mockApiClient.delete(`${PATH}/${occurrence.id}/result`, {
        query: { occurrenceVersion: occurrence.occurrenceVersion },
      }),
    ).rejects.toMatchObject({ status: 409, code: 70004 });
  });

  it('requires cancelling rest first, blocks direct Task changes/deletion and records UNKNOWN on Task completion', async () => {
    await setup();
    const [occurrence] = await list();
    const taskId = occurrence.linkedTaskId!;
    const rested = await mockApiClient.put<GoalPlanOccurrenceResponse>(
      `${PATH}/${occurrence.id}/rest`,
      undefined,
      {
        query: { occurrenceVersion: occurrence.occurrenceVersion },
      },
    );
    expect(rested).toMatchObject({ status: 'RESTED', scheduledNotificationAt: null });
    expect(await task(taskId)).toMatchObject({ status: 'INBOX', plannedDate: null });
    await expect(mockApiClient.patch(`/api/v1/tasks/${taskId}/done`)).rejects.toMatchObject({
      status: 409,
    });
    await expect(mockApiClient.patch(`/api/v1/tasks/${taskId}/done/cancel`)).rejects.toMatchObject({
      status: 409,
    });
    await expect(mockApiClient.delete(`/api/v1/tasks/${taskId}`)).rejects.toMatchObject({
      status: 409,
    });
    expect(await task(taskId)).toMatchObject({ status: 'INBOX' });
    await mockApiClient.delete(`${PATH}/${occurrence.id}/rest`, {
      query: { occurrenceVersion: rested.occurrenceVersion },
    });
    await mockApiClient.patch(`/api/v1/tasks/${taskId}/done`);
    expect((await list())[0].result).toMatchObject({ actionVariant: 'UNKNOWN' });
    await mockApiClient.patch(`/api/v1/tasks/${taskId}/done/cancel`, undefined, {
      query: { date: TODAY },
    });
    expect((await list())[0]).toMatchObject({ status: 'PENDING', result: null });
  });

  it('keeps practiced/past snapshots and applies future plan/goal versions by date', async () => {
    const { plan, goal, request } = await setup();
    const original = await list('2026-10-17', '2026-10-20');
    const today = original[1];
    await mockApiClient.put(`${PATH}/${today.id}/result`, {
      actionVariant: 'STANDARD',
      practicedAt: `${TODAY}T12:00:00`,
    });
    await mockApiClient.patch(`/api/v1/goals/${goal.id}`, {
      title: '영어로 일하기',
      effectiveFromDate: '2026-10-20',
    });
    await mockApiClient.patch(`/api/v1/goal-plans/${plan.id}`, {
      ...request,
      name: '다음 단어 복습',
      effectiveFromDate: TODAY,
    });
    const rows = await list('2026-10-17', '2026-10-20');
    expect(rows[0]).toMatchObject({ snapshotPlanName: '단어 복습', planVersion: 1 });
    expect(rows[1]).toMatchObject({ snapshotPlanName: '단어 복습', planVersion: 1 });
    expect(rows[2]).toMatchObject({
      snapshotPlanName: '다음 단어 복습',
      planVersion: 2,
      snapshotGoalTitle: '토익 900점',
    });
    expect(rows[3]).toMatchObject({ snapshotGoalTitle: '영어로 일하기', goalVersion: 2 });
    await mockApiClient.patch(`/api/v1/goal-plans/${plan.id}`, {
      ...request,
      effectiveFromDate: '2026-10-19',
    });
    const detached = await mockApiClient.patch<GoalPlanResponse>(`/api/v1/goal-plans/${plan.id}`, {
      ...request,
      goalId: null,
      effectiveFromDate: '2026-10-20',
    });
    expect(detached.goalId).toBeNull();
    expect(await list('2026-10-17', '2026-10-20', goal.id)).toHaveLength(3);
  });

  it('suspends future pending Tasks immediately and resumes them only on explicit reactivation/query', async () => {
    const { goal, plan } = await setup();
    const [occurrence] = await list();
    await mockApiClient.post(`/api/v1/goals/${goal.id}/achievement`);
    expect(await task(occurrence.linkedTaskId!)).toMatchObject({ status: 'INBOX' });
    expect(await list()).toEqual([]);
    await mockApiClient.delete(`/api/v1/goals/${goal.id}/achievement`);
    expect(await list()).toEqual([]);
    await mockApiClient.patch(`/api/v1/goal-plans/${plan.id}/status`, { status: 'ACTIVE' });
    expect((await list())[0].id).toBe(occurrence.id);
    expect(await task(occurrence.linkedTaskId!)).toMatchObject({ status: 'TODAY' });
  });

  it('converts practiced wall-clock to Seoul completion time and isolates/merges occurrences by owner', async () => {
    const { goal } = await setup({
      schedule: { startDate: TODAY, days: allDays, timeZone: 'America/New_York' },
    });
    const [occurrence] = await list();
    await mockApiClient.put(`${PATH}/${occurrence.id}/result`, {
      actionVariant: 'MINIMUM',
      practicedAt: '2026-10-18T01:30:00',
      practicedTimeZone: 'America/New_York',
    });
    expect(await task(occurrence.linkedTaskId!)).toMatchObject({
      completedAt: '2026-10-18T14:30:00',
    });
    await mockApiClient.post<TokenResponse>('/api/v1/auth/login', {
      email: 'occurrence-merge@example.com',
      password: 'password123',
    });
    expect(await list(TODAY, TODAY, goal.id)).toHaveLength(1);
    await mockApiClient.post('/api/v1/auth/guest');
    expect(await list()).toEqual([]);
    await expect(mockApiClient.put(`${PATH}/${occurrence.id}/rest`)).rejects.toMatchObject({
      status: 404,
      code: 70003,
    });
    await expect(task(occurrence.linkedTaskId!)).rejects.toMatchObject({ status: 404 });
    // The legacy demo actor sees fixture Tasks; it must still not see another owner's occurrence Task.
    await mockApiClient.post('/api/v1/auth/login', {
      email: 'demo@dooit.app',
      password: 'password123',
    });
    await expect(task(occurrence.linkedTaskId!)).rejects.toMatchObject({ status: 404 });
  });
});
