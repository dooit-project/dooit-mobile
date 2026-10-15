export const ddayQueryKeys = {
  all: ['ddays'] as const,
  list: () => [...ddayQueryKeys.all, 'list'] as const,
  detail: (goalId: number) => [...ddayQueryKeys.all, 'detail', goalId] as const,
  tasks: (goalId: number) => [...ddayQueryKeys.all, 'tasks', goalId] as const,
};
