import type { GoalJourneyItem, GoalJourneyResponse, TaskResponse } from '@/types';

import { goalJourneyApi } from '../goal-journey-api';
import { fetchHistoryPage, goalHistoryRows, legacyHistoryRows } from '../goal-history';

jest.mock('../goal-journey-api', () => ({ goalJourneyApi: { get: jest.fn() } }));
const get = jest.mocked(goalJourneyApi.get);
const item = (fields: Partial<GoalJourneyItem>): GoalJourneyItem => ({
  sourceType: 'PLAN_OCCURRENCE',
  sourceId: 1,
  practicedDate: '2026-11-07',
  goalId: 5,
  goalVersion: 1,
  planId: 1,
  planVersion: 1,
  title: '영단어 30개',
  actionText: null,
  actionVariant: 'UNKNOWN',
  note: null,
  taskId: null,
  serviceDate: '2026-11-07',
  practicedAt: null,
  practicedTimeZone: 'Asia/Seoul',
  snapshotGoalTitle: null,
  nextAction: null,
  difficulties: [],
  ...fields,
});
const page = (items: GoalJourneyItem[], nextCursor: string | null = null, journeyVersion = 'v1') =>
  ({ items, nextCursor, journeyVersion }) as GoalJourneyResponse;

beforeEach(() => get.mockReset());

test('실제 행동과 알 수 없는 실행을 구분하고 동일 원본을 중복 표시하지 않는다', () => {
  const first = item({});
  const second = item({ sourceId: 2, actionVariant: 'MINIMUM', actionText: '영단어 3개 읽기' });
  expect(goalHistoryRows([page([first, second]), page([first])])).toEqual([
    {
      key: 'PLAN_OCCURRENCE:1',
      title: '영단어 30개',
      detail: '반복 계획 · 실천 내용 미확인',
      date: '2026-11-07',
      taskId: null,
    },
    {
      key: 'PLAN_OCCURRENCE:2',
      title: '영단어 3개 읽기',
      detail: null,
      date: '2026-11-07',
      taskId: null,
    },
  ]);
});

test('연결된 Task와 반복 회차가 다른 페이지에 중복되면 회차를 표시한다', () => {
  const linkedTask = item({ sourceType: 'TASK_COMPLETION', sourceId: 11, taskId: 11 });
  const occurrence = item({ sourceId: 5, taskId: 11 });
  expect(goalHistoryRows([page([linkedTask]), page([occurrence])]).map((row) => row.key)).toEqual([
    'PLAN_OCCURRENCE:5',
  ]);
});

test('이전 목표의 완료일은 실제 완료 시각만 사용하고 없는 경우 추정하지 않는다', () => {
  const task = (id: number, completedAt: string | null, status = 'DONE') =>
    ({ id, title: `할 일 ${id}`, completedAt, status, plannedDate: '2026-10-01' }) as TaskResponse;
  expect(
    legacyHistoryRows([task(1, null), task(2, '2026-11-06T10:00:00'), task(3, null, 'TODO')]),
  ).toEqual([
    { key: 'task:2', title: '할 일 2', detail: null, date: '2026-11-06', taskId: 2 },
    { key: 'task:1', title: '할 일 1', detail: null, date: null, taskId: 1 },
  ]);
});

test('커서가 반복되거나 페이지 사이 원본 버전이 바뀌면 연결하지 않는다', async () => {
  get.mockResolvedValueOnce(page([], 'next', 'v2'));
  await expect(
    fetchHistoryPage(5, '2026-11-08', { cursor: 'first', version: 'v1', used: [] }),
  ).rejects.toThrow('변경');
  get.mockResolvedValueOnce(page([], 'first'));
  await expect(
    fetchHistoryPage(5, '2026-11-08', { cursor: 'second', version: 'v1', used: ['first'] }),
  ).rejects.toThrow('불러오지');
});

test('이전 페이지의 범위와 버전을 이어 다음 기록을 읽는다', async () => {
  const next = page([item({ sourceId: 21 })], null, 'v1');
  get.mockResolvedValueOnce(next);
  await expect(
    fetchHistoryPage(5, '2026-11-08', { cursor: 'older', version: 'v1', used: [] }),
  ).resolves.toBe(next);
  expect(get).toHaveBeenCalledWith(
    5,
    { from: '0100-01-01', to: '2026-11-08', timeZone: 'Asia/Seoul', limit: 20, cursor: 'older' },
    undefined,
  );
});
