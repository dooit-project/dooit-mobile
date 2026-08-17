import { apiClient } from '@/services/api';
import type {
  WorkspaceInviteRequest,
  WorkspaceInvitationResponse,
  WorkspaceMemberResponse,
  WorkspaceMemberUpdateRequest,
  WorkspaceRequest,
  WorkspaceResponse,
} from '@/types';

const WORKSPACES_PATH = '/api/v1/workspaces';
const WORKSPACE_INVITATIONS_PATH = '/api/v1/workspace-invitations';

export const workspaceApi = {
  list(signal?: AbortSignal) {
    return apiClient.get<WorkspaceResponse[]>(WORKSPACES_PATH, { signal });
  },

  listInvitations(signal?: AbortSignal) {
    return apiClient.get<WorkspaceInvitationResponse[]>(WORKSPACE_INVITATIONS_PATH, { signal });
  },

  get(workspaceId: number, signal?: AbortSignal) {
    return apiClient.get<WorkspaceResponse>(`${WORKSPACES_PATH}/${workspaceId}`, { signal });
  },

  create(request: WorkspaceRequest, signal?: AbortSignal) {
    return apiClient.post<WorkspaceResponse>(WORKSPACES_PATH, request, { signal });
  },

  update(workspaceId: number, request: WorkspaceRequest, signal?: AbortSignal) {
    return apiClient.put<WorkspaceResponse>(`${WORKSPACES_PATH}/${workspaceId}`, request, {
      signal,
    });
  },

  delete(workspaceId: number, signal?: AbortSignal) {
    return apiClient.delete<null>(`${WORKSPACES_PATH}/${workspaceId}`, { signal });
  },

  listMembers(workspaceId: number, signal?: AbortSignal) {
    return apiClient.get<WorkspaceMemberResponse[]>(`${WORKSPACES_PATH}/${workspaceId}/members`, {
      signal,
    });
  },

  inviteMember(workspaceId: number, request: WorkspaceInviteRequest, signal?: AbortSignal) {
    return apiClient.post<WorkspaceMemberResponse>(
      `${WORKSPACES_PATH}/${workspaceId}/members`,
      request,
      { signal },
    );
  },

  updateMember(
    workspaceId: number,
    memberId: number,
    request: WorkspaceMemberUpdateRequest,
    signal?: AbortSignal,
  ) {
    return apiClient.patch<WorkspaceMemberResponse>(
      `${WORKSPACES_PATH}/${workspaceId}/members/${memberId}`,
      request,
      { signal },
    );
  },

  acceptInvite(workspaceId: number, memberId: number, signal?: AbortSignal) {
    return apiClient.patch<WorkspaceMemberResponse>(
      `${WORKSPACES_PATH}/${workspaceId}/members/${memberId}`,
      { status: 'ACTIVE' },
      { signal },
    );
  },

  removeMember(workspaceId: number, memberId: number, signal?: AbortSignal) {
    return apiClient.delete<null>(`${WORKSPACES_PATH}/${workspaceId}/members/${memberId}`, {
      signal,
    });
  },
};
