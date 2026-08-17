import { workspaceQueryKeys } from '@/features/workspaces/workspace-query-keys';

describe('Workspace query key', () => {
  test('목록·단건·멤버 cache를 workspace별로 격리한다', () => {
    expect(workspaceQueryKeys.list()).toEqual(['workspaces', 'list']);
    expect(workspaceQueryKeys.invitations(7)).toEqual(['workspaces', 'invitations', 7]);
    expect(workspaceQueryKeys.invitations(7)).not.toEqual(workspaceQueryKeys.invitations(8));
    expect(workspaceQueryKeys.detail(3)).toEqual(['workspaces', 'detail', 3]);
    expect(workspaceQueryKeys.members(3)).toEqual(['workspaces', 'detail', 3, 'members']);
    expect(workspaceQueryKeys.members(3)).not.toEqual(workspaceQueryKeys.members(4));
  });

  test('Task key를 workspace별로 격리한다', () => {
    const query = { type: 'DAY', date: '2026-08-16' } as const;

    expect(workspaceQueryKeys.tasks(3)).toEqual(['workspaces', 'detail', 3, 'tasks']);
    expect(workspaceQueryKeys.taskList(3, query)).toEqual([
      'workspaces',
      'detail',
      3,
      'tasks',
      'list',
      query,
    ]);
    expect(workspaceQueryKeys.taskDetail(3, 7)).toEqual([
      'workspaces',
      'detail',
      3,
      'tasks',
      'detail',
      7,
    ]);
    expect(workspaceQueryKeys.taskList(3, query)).not.toEqual(
      workspaceQueryKeys.taskList(4, query),
    );
  });

  test('D-Day key를 workspace와 목표별로 격리한다', () => {
    expect(workspaceQueryKeys.ddayGoals(3)).toEqual(['workspaces', 'detail', 3, 'dday-goals']);
    expect(workspaceQueryKeys.ddayGoalDetail(3, 8)).toEqual([
      'workspaces',
      'detail',
      3,
      'dday-goals',
      'detail',
      8,
    ]);
    expect(workspaceQueryKeys.ddayGoalTasks(3, 8)).toEqual([
      'workspaces',
      'detail',
      3,
      'dday-goals',
      'detail',
      8,
      'tasks',
    ]);
    expect(workspaceQueryKeys.ddayGoalTasks(3, 8)).not.toEqual(
      workspaceQueryKeys.ddayGoalTasks(4, 8),
    );
  });

  test('알림 후보 key를 계정·workspace·기간별로 격리한다', () => {
    const key = workspaceQueryKeys.notificationCandidates(7, 3, '2026-08-17', '2026-09-16');

    expect(key).toEqual([
      'workspaces',
      'detail',
      3,
      'tasks',
      'notification-candidates',
      7,
      '2026-08-17',
      '2026-09-16',
    ]);
    expect(key).not.toEqual(
      workspaceQueryKeys.notificationCandidates(8, 3, '2026-08-17', '2026-09-16'),
    );
    expect(key).not.toEqual(
      workspaceQueryKeys.notificationCandidates(7, 4, '2026-08-17', '2026-09-16'),
    );
  });
});
