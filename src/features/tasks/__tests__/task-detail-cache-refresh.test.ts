import { QueryClient } from '@tanstack/react-query';

import { ddayQueryKeys } from '@/features/dday/dday-query-keys';
import { taskQueryKeys } from '@/features/tasks/task-query-keys';
import { useChangeTaskDate } from '@/features/tasks/use-change-task-date';
import { useCompleteTask } from '@/features/tasks/use-complete-task';
import { useDeleteTask } from '@/features/tasks/use-delete-task';
import { useReopenTask } from '@/features/tasks/use-reopen-task';
import { useUpdateTask } from '@/features/tasks/use-update-task';
import type { TaskResponse } from '@/types';

let mockClient: QueryClient;
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => mockClient,
  useMutation: (options: unknown) => options,
}));
jest.mock('@/features/notifications', () => ({ requestTaskNotificationSync: jest.fn() }));

type MutationOptions = {
  onSuccess: (task: TaskResponse | undefined, variables?: { taskId: number }) => void;
};
const date = '2026-10-24';
const task = {
  id: 4,
  title: '시험 접수',
  status: 'DONE',
  completedAt: `${date}T14:30:00`,
} as TaskResponse;

beforeEach(() => {
  mockClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockClient.setQueryData(ddayQueryKeys.tasks(1), [{ ...task, status: 'TODAY' }]);
  mockClient.setQueryData(taskQueryKeys.list({ type: 'DAY', date }), [
    { ...task, status: 'TODAY' },
  ]);
});
afterEach(() => mockClient.clear());

test.each([
  ['수정', () => useUpdateTask()],
  ['실행일 변경', () => useChangeTaskDate()],
  ['완료', () => useCompleteTask(date)],
  ['완료 취소', () => useReopenTask(date)],
  ['삭제', () => useDeleteTask()],
] as const)(
  '%s 후 닫아도 계획과 달력에 이전 항목이 남지 않게 조회를 갱신한다',
  (_name, mutation) => {
    const options = mutation() as unknown as MutationOptions;
    options.onSuccess(task, { taskId: task.id });
    expect(mockClient.getQueryState(ddayQueryKeys.tasks(1))?.isInvalidated).toBe(true);
    expect(mockClient.getQueryState(taskQueryKeys.list({ type: 'DAY', date }))?.isInvalidated).toBe(
      true,
    );
  },
);
