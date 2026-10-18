import type { GoalDirectLogRequest, GoalDirectLogResponse, GoalResponse } from '@/types';

import { mockApiClient } from '../mock-api-client';

describe('Goal direct log contract', () => {
  const original: GoalDirectLogRequest = {
    practicedDate: '2026-10-18',
    title: '토익 문제 30개 풀기',
    note: '오답 세 개를 다시 풀었어요',
  };
  let goal: GoalResponse;
  let path: string;
  beforeEach(async () => {
    await mockApiClient.post('/api/v1/auth/guest');
    goal = await mockApiClient.post<GoalResponse>('/api/v1/goals', { title: '토익 900점' });
    path = `/api/v1/goals/${goal.id}/direct-logs`;
  });
  function create(body: GoalDirectLogRequest = original, key = 'original-attempt') {
    return mockApiClient.post<GoalDirectLogResponse>(path, body, { idempotencyKey: key });
  }

  it('replays normalized creation payload to the current edited/canceled record', async () => {
    const first = await create();
    expect(first).toMatchObject({
      goalId: goal.id,
      goalVersion: 1,
      practicedTimeZone: 'Asia/Seoul',
      canceledAt: null,
    });
    expect(
      await create({ ...original, title: ` ${original.title} `, practicedTimeZone: 'Asia/Seoul' }),
    ).toEqual(first);
    const updated = await mockApiClient.patch<GoalDirectLogResponse>(
      `/api/v1/goal-direct-logs/${first.id}`,
      {
        practicedDate: '2026-10-19',
        title: '오답 5개 복습',
      },
    );
    expect(updated).toMatchObject({ id: first.id, note: null, goalVersion: 1 });
    expect(await create()).toEqual(updated);
    // Retrying an edit as a create with the old key is not the original request.
    await expect(
      create({ practicedDate: '2026-10-19', title: '오답 5개 복습' }),
    ).rejects.toMatchObject({ status: 409, code: 10004 });
    await mockApiClient.delete(`/api/v1/goal-direct-logs/${first.id}`);
    const canceled = await create();
    expect(canceled).toMatchObject({ id: first.id, canceledAt: expect.any(String) });
    await mockApiClient.delete(`/api/v1/goal-direct-logs/${first.id}`);
    expect(await create()).toEqual(canceled);
    await expect(
      mockApiClient.patch(`/api/v1/goal-direct-logs/${first.id}`, original),
    ).rejects.toMatchObject({ status: 409, code: 70007 });
  });

  it('selects the original dated Goal snapshot and preserves it after moving the record date', async () => {
    await mockApiClient.patch(`/api/v1/goals/${goal.id}`, {
      title: '영어로 일하기',
      effectiveFromDate: '2026-10-20',
    });
    const first = await create();
    expect(first.goalVersion).toBe(1);
    const later = await create({ ...original, practicedDate: '2026-10-21' }, 'later');
    expect(later.goalVersion).toBe(2);
    expect(
      await mockApiClient.patch(`/api/v1/goal-direct-logs/${first.id}`, {
        ...original,
        practicedDate: '2026-10-21',
      }),
    ).toMatchObject({ id: first.id, goalVersion: 1 });
  });

  it('scopes idempotency by goal and transfers records with the guest owner', async () => {
    const first = await create();
    const otherGoal = await mockApiClient.post<GoalResponse>('/api/v1/goals', {
      title: '건강한 몸',
    });
    const sameKeyOtherGoal = await mockApiClient.post<GoalDirectLogResponse>(
      `/api/v1/goals/${otherGoal.id}/direct-logs`,
      original,
      { idempotencyKey: 'original-attempt' },
    );
    expect(sameKeyOtherGoal.id).not.toBe(first.id);
    await mockApiClient.post('/api/v1/auth/login', {
      email: 'direct-log-merge@example.com',
      password: 'password123',
    });
    expect(await create()).toEqual(first);
    await mockApiClient.post('/api/v1/auth/guest');
    await expect(create()).rejects.toMatchObject({ status: 404, code: 70001 });
    await expect(
      mockApiClient.patch(`/api/v1/goal-direct-logs/${first.id}`, original),
    ).rejects.toMatchObject({ status: 404, code: 70006 });
    await expect(
      mockApiClient.delete(`/api/v1/goal-direct-logs/${first.id}`),
    ).rejects.toMatchObject({ status: 404, code: 70006 });
  });

  it('requires an explicit bounded key and validates content before recording an attempt', async () => {
    await expect(mockApiClient.post(path, original)).rejects.toMatchObject({
      status: 400,
      code: 10001,
    });
    await expect(create(original, ' '.repeat(2))).rejects.toMatchObject({ status: 400 });
    await expect(create(original, 'x'.repeat(161))).rejects.toMatchObject({ status: 400 });
    await expect(create({ ...original, practicedDate: '2026-02-30' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(create({ ...original, practicedTimeZone: 'Invalid/Zone' })).rejects.toMatchObject({
      status: 400,
    });
    // Invalid input must not reserve the attempt key.
    expect(await create()).toMatchObject({ title: original.title });
  });
});
