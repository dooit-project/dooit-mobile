import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { WorkspaceInvitationResponse, WorkspaceResponse } from '@/types';

import { workspaceApi } from './workspace-api';
import { workspaceQueryKeys } from './workspace-query-keys';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useWorkspaceInvitations(accountId: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.invitations(accountId),
    queryFn: ({ signal }) => workspaceApi.listInvitations(signal),
    enabled: canFetch && accountId > 0,
  });
}

export function useAcceptWorkspaceInvitation(accountId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitation: WorkspaceInvitationResponse) =>
      workspaceApi.acceptInvite(invitation.workspace.id, invitation.membership.id),
    onSuccess: (_membership, invitation) => {
      queryClient.setQueryData<WorkspaceInvitationResponse[]>(
        workspaceQueryKeys.invitations(accountId),
        (current = []) => current.filter((item) => item.membership.id !== invitation.membership.id),
      );
      queryClient.setQueryData<WorkspaceResponse[]>(workspaceQueryKeys.list(), (current = []) => [
        ...current.filter((item) => item.id !== invitation.workspace.id),
        invitation.workspace,
      ]);
      queryClient.setQueryData(
        workspaceQueryKeys.detail(invitation.workspace.id),
        invitation.workspace,
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(invitation.workspace.id),
      });
    },
  });
}
