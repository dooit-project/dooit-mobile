import { mockApiClient } from '@/services/api/mock-api-client';
import type { WorkspaceMemberResponse, WorkspaceResponse } from '@/types';

describe('Mock Workspace API', () => {
  test('Workspace 생성·조회·수정·삭제 흐름을 지원한다', async () => {
    const created = await mockApiClient.post<WorkspaceResponse>('/api/v1/workspaces', {
      name: '제품팀',
      description: '출시 준비',
    });

    await expect(mockApiClient.get<WorkspaceResponse[]>('/api/v1/workspaces')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id, name: '제품팀' })]),
    );

    const updated = await mockApiClient.put<WorkspaceResponse>(`/api/v1/workspaces/${created.id}`, {
      name: '모바일팀',
      description: null,
    });
    expect(updated).toMatchObject({ name: '모바일팀', description: null });

    await mockApiClient.delete(`/api/v1/workspaces/${created.id}`);
    await expect(mockApiClient.get(`/api/v1/workspaces/${created.id}`)).rejects.toMatchObject({
      status: 404,
    });
  });

  test('멤버 초대·수락·목록·제거 흐름을 지원한다', async () => {
    const workspace = await mockApiClient.post<WorkspaceResponse>('/api/v1/workspaces', {
      name: '공유팀',
    });
    const invited = await mockApiClient.post<WorkspaceMemberResponse>(
      `/api/v1/workspaces/${workspace.id}/members`,
      { email: 'member@todolab.app', role: 'EDITOR' },
    );
    expect(invited).toMatchObject({ role: 'EDITOR', status: 'PENDING' });

    const accepted = await mockApiClient.patch<WorkspaceMemberResponse>(
      `/api/v1/workspaces/${workspace.id}/members/${invited.id}`,
      { status: 'ACTIVE' },
    );
    expect(accepted.status).toBe('ACTIVE');

    const members = await mockApiClient.get<WorkspaceMemberResponse[]>(
      `/api/v1/workspaces/${workspace.id}/members`,
    );
    expect(members).toEqual(expect.arrayContaining([expect.objectContaining({ id: invited.id })]));

    await mockApiClient.delete(`/api/v1/workspaces/${workspace.id}/members/${invited.id}`);
    const remaining = await mockApiClient.get<WorkspaceMemberResponse[]>(
      `/api/v1/workspaces/${workspace.id}/members`,
    );
    expect(remaining).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: invited.id })]),
    );
  });
});
