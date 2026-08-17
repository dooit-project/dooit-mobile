import type { LocalDateTimeString } from './date-time';

export type WorkspaceRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type WorkspaceMemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';

export type WorkspaceRequest = {
  name: string;
  description?: string | null;
};

export type WorkspaceInviteRequest = {
  email: string;
  role?: Exclude<WorkspaceRole, 'OWNER'> | null;
};

export type WorkspaceMemberUpdateRequest = {
  role?: WorkspaceRole | null;
  status?: WorkspaceMemberStatus | null;
};

export type WorkspaceResponse = {
  id: number;
  name: string;
  description: string | null;
  createdByUserId: number;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

export type WorkspaceMemberResponse = {
  id: number;
  workspaceId: number;
  userId: number;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

export type WorkspaceInvitationResponse = {
  workspace: WorkspaceResponse;
  membership: WorkspaceMemberResponse;
  invitedAt: LocalDateTimeString;
};
