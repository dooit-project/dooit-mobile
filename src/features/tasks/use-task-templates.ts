import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { taskTemplateApi } from './task-template-api';
import { taskTemplateQueryKeys } from './task-template-query-keys';

export function useTaskTemplates() {
  const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

  return useQuery({
    queryKey: taskTemplateQueryKeys.list(),
    queryFn: ({ signal }) => taskTemplateApi.list(signal),
    enabled: canFetch,
  });
}
