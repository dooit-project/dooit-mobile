import { workspaceApi } from '@/features/workspaces/workspace-api';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const deleteMock = apiClient.delete as jest.Mock;
const patchMock = apiClient.patch as jest.Mock;
const postMock = apiClient.post as jest.Mock;
const putMock = apiClient.put as jest.Mock;

describe('Workspace API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Workspace CRUD endpoint를 호출한다', async () => {
    const request = { name: '제품팀', description: '출시 계획' };

    await workspaceApi.list();
    await workspaceApi.get(3);
    await workspaceApi.create(request);
    await workspaceApi.update(3, request);
    await workspaceApi.delete(3);

    expect(getMock).toHaveBeenNthCalledWith(1, '/api/v1/workspaces', { signal: undefined });
    expect(getMock).toHaveBeenNthCalledWith(2, '/api/v1/workspaces/3', { signal: undefined });
    expect(postMock).toHaveBeenCalledWith('/api/v1/workspaces', request, { signal: undefined });
    expect(putMock).toHaveBeenCalledWith('/api/v1/workspaces/3', request, { signal: undefined });
    expect(deleteMock).toHaveBeenCalledWith('/api/v1/workspaces/3', { signal: undefined });
  });

  test('멤버 조회·초대·수락·제거 endpoint를 호출한다', async () => {
    await workspaceApi.listInvitations();
    await workspaceApi.listMembers(3);
    await workspaceApi.inviteMember(3, { email: 'member@example.com', role: 'EDITOR' });
    await workspaceApi.acceptInvite(3, 9);
    await workspaceApi.removeMember(3, 9);

    expect(getMock).toHaveBeenCalledWith('/api/v1/workspace-invitations', {
      signal: undefined,
    });
    expect(getMock).toHaveBeenCalledWith('/api/v1/workspaces/3/members', {
      signal: undefined,
    });
    expect(postMock).toHaveBeenCalledWith(
      '/api/v1/workspaces/3/members',
      { email: 'member@example.com', role: 'EDITOR' },
      { signal: undefined },
    );
    expect(patchMock).toHaveBeenCalledWith(
      '/api/v1/workspaces/3/members/9',
      { status: 'ACTIVE' },
      { signal: undefined },
    );
    expect(deleteMock).toHaveBeenCalledWith('/api/v1/workspaces/3/members/9', {
      signal: undefined,
    });
  });
});
