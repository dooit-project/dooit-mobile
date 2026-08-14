import { workspaceDdayApi } from '@/features/workspaces/workspace-dday-api';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: { get: jest.fn(), delete: jest.fn(), post: jest.fn() },
}));

describe('Workspace D-Day API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('D-Day 생성·조회·연결 Task·삭제 endpoint를 호출한다', async () => {
    const request = { title: '공유 출시', targetDate: '2026-09-01' as const };
    await workspaceDdayApi.list(3);
    await workspaceDdayApi.get(3, 8);
    await workspaceDdayApi.create(3, request);
    await workspaceDdayApi.listTasks(3, 8);
    await workspaceDdayApi.delete(3, 8);

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/workspaces/3/dday-goals', {
      signal: undefined,
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/workspaces/3/dday-goals/8', {
      signal: undefined,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/workspaces/3/dday-goals', request, {
      signal: undefined,
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/api/v1/workspaces/3/dday-goals/8/tasks', {
      signal: undefined,
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/workspaces/3/dday-goals/8', {
      signal: undefined,
    });
  });
});
