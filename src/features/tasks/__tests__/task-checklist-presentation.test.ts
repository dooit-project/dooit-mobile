import type { TaskChecklistItemResponse } from '@/types';

import { getTaskChecklistProgress, moveTaskChecklistItem } from '../task-checklist-presentation';

const items: TaskChecklistItemResponse[] = [
  {
    id: 3,
    taskId: 42,
    title: '세 번째',
    done: false,
    sortOrder: 2,
    completedAt: null,
    createdAt: '2026-09-05T09:00:00',
    updatedAt: null,
  },
  {
    id: 1,
    taskId: 42,
    title: '첫 번째',
    done: true,
    sortOrder: 0,
    completedAt: '2026-09-05T10:00:00',
    createdAt: '2026-09-05T09:00:00',
    updatedAt: null,
  },
  {
    id: 2,
    taskId: 42,
    title: '두 번째',
    done: true,
    sortOrder: 1,
    completedAt: '2026-09-05T10:00:00',
    createdAt: '2026-09-05T09:00:00',
    updatedAt: null,
  },
];

describe('task checklist presentation', () => {
  test('완료와 남은 항목 진행률을 계산한다', () => {
    expect(getTaskChecklistProgress(items)).toEqual({
      completed: 2,
      remaining: 1,
      total: 3,
      ratio: 2 / 3,
    });
    expect(getTaskChecklistProgress([])).toEqual({
      completed: 0,
      remaining: 0,
      total: 0,
      ratio: 0,
    });
  });

  test('sortOrder 기준으로 한 칸씩 재정렬하고 경계에서는 유지한다', () => {
    expect(moveTaskChecklistItem(items, 2, 'up')).toEqual([2, 1, 3]);
    expect(moveTaskChecklistItem(items, 2, 'down')).toEqual([1, 3, 2]);
    expect(moveTaskChecklistItem(items, 1, 'up')).toEqual([1, 2, 3]);
    expect(moveTaskChecklistItem(items, 3, 'down')).toEqual([1, 2, 3]);
  });
});
