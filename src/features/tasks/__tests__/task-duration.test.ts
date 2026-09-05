import {
  formatEstimatedDuration,
  getTotalEstimatedDurationMinutes,
  parseEstimatedDurationMinutes,
} from '@/features/tasks/task-duration';
import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskResponse } from '@/types';

function createTask(id: number, estimatedDurationMinutes?: number | null): TaskResponse {
  return {
    id,
    type: 'TODO',
    title: `Task ${id}`,
    description: null,
    startAt: null,
    endAt: null,
    allDay: false,
    unscheduled: false,
    category: null,
    estimatedDurationMinutes,
    status: 'TODAY',
    plannedDate: '2026-09-04',
    targetDate: null,
    todayOrder: id,
    completedAt: null,
    carryOverCount: 0,
    staleCarryOver: false,
    deferReason: null,
    deferReasonLabel: null,
    ddayGoalId: null,
    ddayGoalTitle: null,
    ddayGoalTargetDate: null,
    ddayDaysLeft: null,
    createdAt: '2026-09-04T09:00:00',
    updatedAt: null,
  };
}

describe('Task 예상 시간', () => {
  test.each([
    ['', { ok: true, value: null }],
    ['5', { ok: true, value: 5 }],
    ['1440', { ok: true, value: 1440 }],
    ['0', { ok: false }],
    ['4', { ok: false }],
    ['1441', { ok: false }],
    ['1.5', { ok: false }],
  ])('입력 %s를 검증한다', (value, expected) => {
    expect(parseEstimatedDurationMinutes(value)).toEqual(expected);
  });

  test('설정된 예상 시간만 합산한다', () => {
    expect(
      getTotalEstimatedDurationMinutes([
        createTask(1, 25),
        createTask(2, null),
        createTask(3),
        createTask(4, 65),
      ]),
    ).toBe(90);
  });

  test('mock API가 생성과 수정 시 예상 시간을 저장한다', async () => {
    const created = await mockApiClient.post<TaskResponse>('/api/v1/tasks', {
      title: '예상 시간 확인',
      type: 'TODO',
      allDay: false,
      estimatedDurationMinutes: 35,
    });

    expect(created.estimatedDurationMinutes).toBe(35);

    const updated = await mockApiClient.put<TaskResponse>(`/api/v1/tasks/${created.id}`, {
      title: created.title,
      type: created.type,
      allDay: created.allDay,
      estimatedDurationMinutes: null,
    });

    expect(updated.estimatedDurationMinutes).toBeNull();
  });

  test.each([
    [25, '25분'],
    [60, '1시간'],
    [95, '1시간 35분'],
  ])('%d분을 읽기 좋은 형식으로 표시한다', (minutes, expected) => {
    expect(formatEstimatedDuration(minutes)).toBe(expected);
  });
});
