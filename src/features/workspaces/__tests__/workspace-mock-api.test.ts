import { mockApiClient } from '@/services/api/mock-api-client';
import type {
  DdayGoalResponse,
  TaskResponse,
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from '@/types';

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

  test('Workspace Task CRUD와 날짜별 목록을 지원한다', async () => {
    const workspace = await mockApiClient.post<WorkspaceResponse>('/api/v1/workspaces', {
      name: '일정팀',
    });
    const path = `/api/v1/workspaces/${workspace.id}/tasks`;
    const created = await mockApiClient.post<TaskResponse>(path, {
      title: '공유 일정',
      type: 'SCHEDULE',
      allDay: true,
      startAt: '2026-08-16T00:00:00',
      endAt: '2026-08-17T00:00:00',
    });

    await expect(
      mockApiClient.get<TaskResponse[]>(path, { query: { type: 'DAY', date: '2026-08-16' } }),
    ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id })]));

    const todo = await mockApiClient.post<TaskResponse>(path, {
      title: '공유 할 일',
      type: 'TODO',
      allDay: true,
      startAt: '2026-08-16T00:00:00',
      endAt: '2026-08-17T00:00:00',
    });
    await expect(
      mockApiClient.get<TaskResponse[]>(path, { query: { type: 'DAY', date: '2026-08-16' } }),
    ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: todo.id })]));

    const updated = await mockApiClient.put<TaskResponse>(`${path}/${created.id}`, {
      title: '수정된 공유 일정',
      type: 'SCHEDULE',
      allDay: true,
      startAt: '2026-08-16T00:00:00',
      endAt: '2026-08-17T00:00:00',
    });
    expect(updated.title).toBe('수정된 공유 일정');

    await mockApiClient.delete(`${path}/${created.id}`);
    await expect(mockApiClient.get(`${path}/${created.id}`)).rejects.toMatchObject({ status: 404 });
  });

  test('Workspace D-Day 생성·조회·연결 Task 조회·삭제를 지원한다', async () => {
    const workspace = await mockApiClient.post<WorkspaceResponse>('/api/v1/workspaces', {
      name: '목표팀',
    });
    const path = `/api/v1/workspaces/${workspace.id}/dday-goals`;
    const created = await mockApiClient.post<DdayGoalResponse>(path, {
      title: '공유 출시일',
      targetDate: '2026-09-01',
    });

    await expect(mockApiClient.get<DdayGoalResponse[]>(path)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id, title: '공유 출시일' })]),
    );
    await expect(mockApiClient.get(`${path}/${created.id}`)).resolves.toMatchObject({
      id: created.id,
    });
    const taskPath = `/api/v1/workspaces/${workspace.id}/tasks`;
    const task = await mockApiClient.post<TaskResponse>(taskPath, {
      title: '출시 준비',
      type: 'TODO',
      allDay: true,
      startAt: '2026-08-17T00:00:00',
      endAt: '2026-08-18T00:00:00',
    });
    const connected = await mockApiClient.patch<TaskResponse>(
      `${taskPath}/${task.id}/dday-goal`,
      undefined,
      { query: { ddayGoalId: created.id } },
    );
    expect(connected).toMatchObject({ ddayGoalId: created.id, ddayGoalTitle: '공유 출시일' });
    await expect(mockApiClient.get(`${path}/${created.id}/tasks`)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: task.id })]),
    );

    const disconnected = await mockApiClient.delete<TaskResponse>(
      `${taskPath}/${task.id}/dday-goal`,
    );
    expect(disconnected.ddayGoalId).toBeNull();
    await expect(mockApiClient.get(`${path}/${created.id}/tasks`)).resolves.toEqual([]);

    await mockApiClient.delete(`${path}/${created.id}`);
    await expect(mockApiClient.get(`${path}/${created.id}`)).rejects.toMatchObject({ status: 404 });
  });
});
