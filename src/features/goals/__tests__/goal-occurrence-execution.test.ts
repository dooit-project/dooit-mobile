import { QueryClient } from '@tanstack/react-query';

import { separateTodayGoalItems } from '@/features/today/today-goal-items';
import { getAccessToken } from '@/services/api';
import type { GoalPlanOccurrenceResponse } from '@/types';

import { changeGoalOccurrence } from '../goal-occurrence-change';
import { goalOccurrenceApi } from '../goal-occurrence-api';
import { todayGoalOccurrenceOptions } from '../use-goal-occurrences';

jest.mock('@/services/api', () => ({ getAccessToken: jest.fn(() => 'test-token') }));
jest.mock('../goal-occurrence-api', () => ({
  goalOccurrenceApi: {
    list: jest.fn(),
    saveResult: jest.fn(),
    cancelResult: jest.fn(),
    rest: jest.fn(),
    cancelRest: jest.fn(),
  },
}));

const date = '2026-10-20';
function occurrence(patch: Partial<GoalPlanOccurrenceResponse> = {}): GoalPlanOccurrenceResponse {
  return {
    id: 1,
    goalId: 2,
    goalVersion: 1,
    planId: 3,
    planVersion: 1,
    serviceDate: date,
    timeZone: 'America/New_York',
    status: 'PENDING',
    linkedTaskId: 10,
    notificationKey: `goal-plan:3:${date}`,
    scheduledNotificationAt: null,
    snapshotGoalTitle: 'Read a book',
    snapshotPlanName: 'Read',
    snapshotTriggerText: null,
    snapshotStandardActionText: 'Read 10 pages',
    snapshotMinimumActionText: 'Read one paragraph',
    snapshotNextAction: null,
    occurrenceVersion: 7,
    result: null,
    ...patch,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getAccessToken).mockReturnValue('test-token');
});

describe('Today occurrence read coordination', () => {
  it('materializes one day before refreshing Task and daily-plan caches', async () => {
    const client = new QueryClient();
    client.setQueryData(['auth', 'me'], { id: 1 });
    const refresh = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
    jest.mocked(goalOccurrenceApi.list).mockImplementation(async () => {
      expect(refresh).not.toHaveBeenCalled();
      return [occurrence()];
    });
    const controller = new AbortController();
    expect(
      await todayGoalOccurrenceOptions(client, date).queryFn({ signal: controller.signal }),
    ).toHaveLength(1);
    expect(goalOccurrenceApi.list).toHaveBeenCalledWith(
      { from: date, to: date },
      controller.signal,
    );
    expect(refresh.mock.calls.map(([options]) => options?.queryKey)).toEqual([
      ['tasks'],
      ['daily-plans'],
    ]);
    client.clear();
  });

  it.each(['owner-change', 'logout', 'abort'] as const)(
    'does not refresh another session after %s',
    async (reason) => {
      const client = new QueryClient();
      client.setQueryData(['auth', 'me'], { id: 1 });
      const refresh = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
      const controller = new AbortController();
      jest.mocked(goalOccurrenceApi.list).mockImplementation(async () => {
        if (reason === 'owner-change') client.setQueryData(['auth', 'me'], { id: 2 });
        if (reason === 'logout') jest.mocked(getAccessToken).mockReturnValue(null);
        if (reason === 'abort') controller.abort();
        return [occurrence()];
      });
      await todayGoalOccurrenceOptions(client, date).queryFn({ signal: controller.signal });
      expect(refresh).not.toHaveBeenCalled();
      client.clear();
    },
  );
});

describe('Occurrence actions', () => {
  it('keeps explicit variant, actual clock zone, next action and the displayed version', async () => {
    const request = {
      actionVariant: 'MINIMUM' as const,
      practicedAt: '2026-10-20T22:30:00',
      practicedTimeZone: 'Asia/Seoul',
      nextActionPatchKind: 'REPLACE' as const,
      nextAction: 'Continue on page 12',
    };
    await changeGoalOccurrence({ type: 'result', occurrence: occurrence(), request });
    expect(goalOccurrenceApi.saveResult).toHaveBeenCalledWith(1, {
      ...request,
      occurrenceVersion: 7,
    });
  });
  it('uses versioned dedicated endpoints for rest and both undo paths', async () => {
    for (const type of ['rest', 'cancel-rest', 'cancel-result'] as const)
      await changeGoalOccurrence({ type, occurrence: occurrence() });
    for (const api of [
      goalOccurrenceApi.rest,
      goalOccurrenceApi.cancelRest,
      goalOccurrenceApi.cancelResult,
    ])
      expect(api).toHaveBeenCalledWith(1, { occurrenceVersion: 7 });
    expect(goalOccurrenceApi.saveResult).not.toHaveBeenCalled();
  });
  it('surfaces a conflict without replaying it or switching to another result type', async () => {
    const conflict = new Error('stale version');
    jest.mocked(goalOccurrenceApi.rest).mockRejectedValueOnce(conflict);
    await expect(changeGoalOccurrence({ type: 'rest', occurrence: occurrence() })).rejects.toBe(
      conflict,
    );
    expect(goalOccurrenceApi.rest).toHaveBeenCalledTimes(1);
    expect(goalOccurrenceApi.cancelResult).not.toHaveBeenCalled();
  });
});

describe('Occurrence and Task duplicate removal', () => {
  it('keeps ordinary Tasks when occurrence data is unavailable', () => {
    const tasks = [{ id: 10 }];
    expect(separateTodayGoalItems(date, tasks, undefined)).toEqual({
      ready: false,
      tasks,
      occurrences: undefined,
    });
    expect(separateTodayGoalItems(date, tasks, []).ready).toBe(true);
  });
  it('uses the newest same-day occurrence and preserves rested/practiced undo rows', () => {
    const rows = [
      occurrence(),
      occurrence({ occurrenceVersion: 8, status: 'PRACTICED' }),
      occurrence({ id: 2, linkedTaskId: 11, status: 'RESTED', goalId: null }),
      occurrence({ id: 3, serviceDate: '2026-10-21', linkedTaskId: 12 }),
      occurrence({ id: 4, linkedTaskId: null }),
    ];
    const result = separateTodayGoalItems(
      date,
      [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }],
      rows,
    );
    expect(result.tasks).toEqual([{ id: 12 }, { id: 13 }]);
    expect(result.occurrences?.map((row) => [row.id, row.status])).toEqual([
      [1, 'PRACTICED'],
      [2, 'RESTED'],
      [4, 'PENDING'],
    ]);
    expect(rows[0].status).toBe('PENDING');
  });
});
