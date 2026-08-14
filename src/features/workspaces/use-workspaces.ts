import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { WorkspaceRequest, WorkspaceResponse } from '@/types';

import { workspaceApi } from './workspace-api';
import { workspaceQueryKeys } from './workspace-query-keys';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceQueryKeys.list(),
    queryFn: ({ signal }) => workspaceApi.list(signal),
    enabled: canFetch,
  });
}

export function useWorkspace(workspaceId: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.detail(workspaceId),
    queryFn: ({ signal }) => workspaceApi.get(workspaceId, signal),
    enabled: canFetch && workspaceId > 0,
  });
}

export function useWorkspaceMembers(workspaceId: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.members(workspaceId),
    queryFn: ({ signal }) => workspaceApi.listMembers(workspaceId, signal),
    enabled: canFetch && workspaceId > 0,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: WorkspaceRequest) => workspaceApi.create(request),
    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceResponse[]>(workspaceQueryKeys.list(), (current = []) => [
        ...current.filter((item) => item.id !== workspace.id),
        workspace,
      ]);
      queryClient.setQueryData(workspaceQueryKeys.detail(workspace.id), workspace);
    },
  });
}
