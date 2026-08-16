import type { LocalDateString, TaskListQuery } from '@/types';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceQueryKeys.all, 'list'] as const,
  detail: (workspaceId: number) => [...workspaceQueryKeys.all, 'detail', workspaceId] as const,
  members: (workspaceId: number) => [...workspaceQueryKeys.detail(workspaceId), 'members'] as const,
  tasks: (workspaceId: number) => [...workspaceQueryKeys.detail(workspaceId), 'tasks'] as const,
  taskList: (workspaceId: number, query: TaskListQuery) =>
    [...workspaceQueryKeys.tasks(workspaceId), 'list', query] as const,
  taskDetail: (workspaceId: number, taskId: number) =>
    [...workspaceQueryKeys.tasks(workspaceId), 'detail', taskId] as const,
  ddayGoals: (workspaceId: number) =>
    [...workspaceQueryKeys.detail(workspaceId), 'dday-goals'] as const,
  ddayGoalDetail: (workspaceId: number, goalId: number) =>
    [...workspaceQueryKeys.ddayGoals(workspaceId), 'detail', goalId] as const,
  ddayGoalTasks: (workspaceId: number, goalId: number) =>
    [...workspaceQueryKeys.ddayGoalDetail(workspaceId, goalId), 'tasks'] as const,
  notificationCandidates: (
    accountId: number,
    workspaceId: number,
    from: LocalDateString,
    to: LocalDateString,
  ) =>
    [
      ...workspaceQueryKeys.tasks(workspaceId),
      'notification-candidates',
      accountId,
      from,
      to,
    ] as const,
};
