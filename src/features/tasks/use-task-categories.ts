import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

export function useTaskCategories() {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

  return useQuery({
    queryKey: taskQueryKeys.categories(),
    queryFn: ({ signal }) => taskApi.getCategories(signal),
    enabled: canFetch,
  });
}
