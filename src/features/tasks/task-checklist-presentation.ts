import type { TaskChecklistItemResponse } from '@/types';

export type ChecklistMoveDirection = 'up' | 'down';

export function getTaskChecklistProgress(items: TaskChecklistItemResponse[]) {
  const total = items.length;
  const completed = items.filter((item) => item.done).length;

  return {
    completed,
    remaining: total - completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
  };
}

export function moveTaskChecklistItem(
  items: TaskChecklistItemResponse[],
  itemId: number,
  direction: ChecklistMoveDirection,
) {
  const orderedIds = [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.id);
  const currentIndex = orderedIds.indexOf(itemId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) {
    return orderedIds;
  }

  [orderedIds[currentIndex], orderedIds[targetIndex]] = [
    orderedIds[targetIndex],
    orderedIds[currentIndex],
  ];

  return orderedIds;
}
