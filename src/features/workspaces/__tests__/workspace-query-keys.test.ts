import { workspaceQueryKeys } from '@/features/workspaces/workspace-query-keys';

describe('Workspace query key', () => {
  test('목록·단건·멤버 cache를 workspace별로 격리한다', () => {
    expect(workspaceQueryKeys.list()).toEqual(['workspaces', 'list']);
    expect(workspaceQueryKeys.detail(3)).toEqual(['workspaces', 'detail', 3]);
    expect(workspaceQueryKeys.members(3)).toEqual(['workspaces', 'detail', 3, 'members']);
    expect(workspaceQueryKeys.members(3)).not.toEqual(workspaceQueryKeys.members(4));
  });
});
