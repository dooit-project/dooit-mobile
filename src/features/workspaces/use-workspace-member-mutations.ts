import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceInviteRequest, WorkspaceMemberResponse, WorkspaceRole } from '@/types';
import { workspaceApi } from './workspace-api';
import { removeWorkspaceMember, upsertWorkspaceMember } from './workspace-member-cache';
import { workspaceQueryKeys } from './workspace-query-keys';

export function useInviteWorkspaceMember(workspaceId: number) {
  return useMutation({
    mutationFn: (request: WorkspaceInviteRequest) =>
      workspaceApi.inviteMember(workspaceId, request),
  });
}
export function useUpdateWorkspaceMemberRole(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: WorkspaceRole }) =>
      workspaceApi.updateMember(workspaceId, memberId, { role }),
    onSuccess: (member) =>
      queryClient.setQueryData<WorkspaceMemberResponse[]>(
        workspaceQueryKeys.members(workspaceId),
        (current) => upsertWorkspaceMember(current, member),
      ),
  });
}
export function useRemoveWorkspaceMember(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: (_, memberId) =>
      queryClient.setQueryData<WorkspaceMemberResponse[]>(
        workspaceQueryKeys.members(workspaceId),
        (current) => removeWorkspaceMember(current, memberId),
      ),
  });
}
