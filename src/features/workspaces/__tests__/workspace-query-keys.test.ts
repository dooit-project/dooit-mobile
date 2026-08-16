import { workspaceQueryKeys } from '@/features/workspaces/workspace-query-keys';

describe('Workspace query key', () => {
  test('목록·단건·멤버 cache를 workspace별로 격리한다', () => {
    expect(workspaceQueryKeys.list()).toEqual(['workspaces', 'list']);
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
});
