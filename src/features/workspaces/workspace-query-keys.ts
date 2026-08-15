import type { TaskListQuery } from '@/types';

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
};
