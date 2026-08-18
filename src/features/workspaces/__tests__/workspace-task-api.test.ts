import { workspaceTaskApi } from '@/features/workspaces/workspace-task-api';
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

describe('Workspace Task API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Task CRUD와 월 범위 endpoint를 호출한다', async () => {
    const request = { title: '공유 일정', allDay: false };
    await workspaceTaskApi.list(3, { type: 'MONTH', taskType: 'SCHEDULE', date: '2026-08-15' });
    await workspaceTaskApi.get(3, 7);
    await workspaceTaskApi.create(3, request);
    await workspaceTaskApi.update(3, 7, request, 'THIS_AND_FUTURE');
    await workspaceTaskApi.delete(3, 7, 'THIS');

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/workspaces/3/tasks', {
      query: { type: 'MONTH', taskType: 'SCHEDULE', date: '2026-08' },
      signal: undefined,
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/workspaces/3/tasks/7', {
      signal: undefined,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks', request, {
      signal: undefined,
    });
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks/7', request, {
      query: { recurrenceScope: 'THIS_AND_FUTURE' },
      signal: undefined,
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks/7', {
      query: { recurrenceScope: 'THIS' },
      signal: undefined,
    });
  });

  test('반복 범위를 생략하면 기본 범위를 백엔드에 위임한다', async () => {
    const request = { title: '공유 일정', allDay: false };

    await workspaceTaskApi.update(3, 7, request);
    await workspaceTaskApi.delete(3, 7);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks/7', request, {
      query: { recurrenceScope: undefined },
      signal: undefined,
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks/7', {
      query: { recurrenceScope: undefined },
      signal: undefined,
    });
  });

  test('D-Day 연결과 알림 후보 endpoint를 호출한다', async () => {
    await workspaceTaskApi.connectDdayGoal(3, 7, 11);
    await workspaceTaskApi.disconnectDdayGoal(3, 7);
    await workspaceTaskApi.getNotificationCandidates(3, '2026-08-15', '2026-08-31');

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/v1/workspaces/3/tasks/7/dday-goal',
      undefined,
      {
        query: { ddayGoalId: 11 },
        signal: undefined,
      },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/workspaces/3/tasks/7/dday-goal', {
      signal: undefined,
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/workspaces/3/tasks/notification-candidates',
      {
        query: { from: '2026-08-15', to: '2026-08-31' },
        signal: undefined,
      },
    );
  });
});
