import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskChecklistItemResponse, TaskResponse } from '@/types';

describe('Mock Task checklist API', () => {
  test('개인 Task checklist CRUD와 전체 재정렬을 지원한다', async () => {
    const task = await mockApiClient.post<TaskResponse>('/api/v1/tasks', {
      title: '체크리스트 대상',
      type: 'TODO',
      allDay: false,
    });
    const path = `/api/v1/tasks/${task.id}/checklist-items`;
    const first = await mockApiClient.post<TaskChecklistItemResponse>(path, {
      title: '자료 확인',
    });
    const second = await mockApiClient.post<TaskChecklistItemResponse>(path, {
      title: '초안 작성',
    });

    await mockApiClient.put(`${path}/${first.id}`, { title: '자료 재확인' });
    await mockApiClient.patch(`${path}/${first.id}/done`, undefined, {
      query: { completedAt: '2026-09-04T09:00:00' },
    });
    const reordered = await mockApiClient.put<TaskChecklistItemResponse[]>(`${path}/order`, {
      orderedItemIds: [second.id, first.id],
    });

    expect(reordered.map(({ id, sortOrder }) => [id, sortOrder])).toEqual([
      [second.id, 0],
      [first.id, 1],
    ]);
    await mockApiClient.delete(`${path}/${second.id}`);
    expect(await mockApiClient.get<TaskChecklistItemResponse[]>(path)).toMatchObject([
      { id: first.id, title: '자료 재확인', done: true, sortOrder: 0 },
    ]);
  });

  test('Workspace VIEWER는 조회만 가능하고 변경은 403이다', async () => {
    const workspace = await mockApiClient.post<{ id: number }>('/api/v1/workspaces', {
      name: '체크리스트 공유 공간',
    });
    const membership = await mockApiClient.post<{ id: number }>(
      `/api/v1/workspaces/${workspace.id}/members`,
      { email: 'member@dooit.app', role: 'VIEWER' },
    );
    const task = await mockApiClient.post<TaskResponse>(
      `/api/v1/workspaces/${workspace.id}/tasks`,
      { title: '공유 작업', type: 'TODO', allDay: false },
    );
    const path = `/api/v1/tasks/${task.id}/checklist-items`;
    await mockApiClient.post(path, { title: '공유 항목' });
    await mockApiClient.patch(`/api/v1/workspaces/${workspace.id}/members/${membership.id}`, {
      status: 'ACTIVE',
    });
    await mockApiClient.post('/api/v1/auth/login', {
      email: 'member@dooit.app',
      password: 'password123',
    });

    await expect(mockApiClient.get<TaskChecklistItemResponse[]>(path)).resolves.toHaveLength(1);
    await expect(mockApiClient.post(path, { title: 'viewer 항목' })).rejects.toMatchObject({
      status: 403,
    });
  });
});
