export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceQueryKeys.all, 'list'] as const,
  detail: (workspaceId: number) => [...workspaceQueryKeys.all, 'detail', workspaceId] as const,
  members: (workspaceId: number) => [...workspaceQueryKeys.detail(workspaceId), 'members'] as const,
};
