/** Separate namespace from ddayQueryKeys, even when numeric IDs coincide. */
export const goalQueryKeys = {
  all: ['goals'] as const,
  list: () => [...goalQueryKeys.all, 'list'] as const,
  detail: (goalId: number) => [...goalQueryKeys.all, 'detail', goalId] as const,
};
