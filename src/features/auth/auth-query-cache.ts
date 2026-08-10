import type { QueryClient } from '@tanstack/react-query';

import type { AuthenticatedUserResponse } from '@/types';

export async function replaceUserQueryCache(
  queryClient: QueryClient,
  user: AuthenticatedUserResponse,
) {
  await queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== 'auth',
  });
  queryClient.setQueryData(['auth', 'me'], user);
}
