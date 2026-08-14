import {
  removeWorkspaceMember,
  upsertWorkspaceMember,
} from '@/features/workspaces/workspace-member-cache';
import type { WorkspaceMemberResponse } from '@/types';
const member = (
  id: number,
  role: WorkspaceMemberResponse['role'] = 'VIEWER',
): WorkspaceMemberResponse => ({
  id,
  workspaceId: 1,
  userId: id,
  email: `member${id}@example.com`,
  displayName: `멤버 ${id}`,
  role,
  status: 'ACTIVE',
  createdAt: '2026-08-15T09:00:00',
  updatedAt: null,
});
describe('Workspace 멤버 캐시', () => {
  test('role 변경 멤버를 같은 위치에서 교체한다', () =>
    expect(upsertWorkspaceMember([member(1), member(2)], member(1, 'EDITOR'))).toEqual([
      member(1, 'EDITOR'),
      member(2),
    ]));
  test('ACTIVE가 아닌 멤버는 제외한다', () =>
    expect(upsertWorkspaceMember([member(1)], { ...member(1), status: 'REMOVED' })).toEqual([]));
  test('선택한 멤버만 제거한다', () =>
    expect(removeWorkspaceMember([member(1), member(2)], 1)).toEqual([member(2)]));
});
