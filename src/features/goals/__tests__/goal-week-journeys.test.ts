import type { GoalJourneyResponse } from '@/types';

import { goalJourneyApi } from '../goal-journey-api';
import { loadGoalWeekJourney } from '../use-goal-week-journeys';

jest.mock('../goal-journey-api', () => ({ goalJourneyApi: { get: jest.fn() } }));

const range = { from: '2026-11-02', to: '2026-11-08' };
const page = (ids: number[], nextCursor: string | null, journeyVersion = 'v1') =>
  ({
    journeyVersion,
    nextCursor,
    items: ids.map((sourceId) => ({ sourceType: 'PLAN_OCCURRENCE', sourceId })),
  }) as GoalJourneyResponse;

beforeEach(() => jest.resetAllMocks());

it('loads all pages with the same range, zone and abort signal', async () => {
  jest
    .mocked(goalJourneyApi.get)
    .mockResolvedValueOnce(page([1], 'next'))
    .mockResolvedValueOnce(page([2], null));
  const signal = new AbortController().signal;
  const items = await loadGoalWeekJourney(4, range, signal);
  expect(items.map((item) => item.sourceId)).toEqual([1, 2]);
  expect(goalJourneyApi.get).toHaveBeenNthCalledWith(
    1,
    4,
    { ...range, timeZone: 'Asia/Seoul', limit: 100 },
    signal,
  );
  expect(goalJourneyApi.get).toHaveBeenNthCalledWith(
    2,
    4,
    { ...range, timeZone: 'Asia/Seoul', limit: 100, cursor: 'next' },
    signal,
  );
});

it('fails instead of mixing records from different snapshots', async () => {
  jest
    .mocked(goalJourneyApi.get)
    .mockResolvedValueOnce(page([1], 'next'))
    .mockResolvedValueOnce(page([2], null, 'v2'));
  await expect(loadGoalWeekJourney(4, range)).rejects.toThrow('기록이 변경되었어요');
});

it('does not return a partial list when a later page fails', async () => {
  jest
    .mocked(goalJourneyApi.get)
    .mockResolvedValueOnce(page([1], 'next'))
    .mockRejectedValueOnce(new Error('network'));
  await expect(loadGoalWeekJourney(4, range)).rejects.toThrow('network');
});

it('stops on a repeated cursor rather than looping forever', async () => {
  jest.mocked(goalJourneyApi.get).mockResolvedValue(page([1], 'same'));
  await expect(loadGoalWeekJourney(4, range)).rejects.toThrow('모두 불러오지 못했어요');
  expect(goalJourneyApi.get).toHaveBeenCalledTimes(2);
});
