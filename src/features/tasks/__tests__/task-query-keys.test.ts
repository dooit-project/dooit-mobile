import { taskQueryKeys } from '@/features/tasks/task-query-keys';

describe('Task query keys', () => {
  test('category와 checklist cache 범위를 분리한다', () => {
    expect(taskQueryKeys.categories()).toEqual(['tasks', 'categories']);
    expect(taskQueryKeys.checklist(42)).toEqual(['tasks', 'detail', 42, 'checklist']);
  });
});
