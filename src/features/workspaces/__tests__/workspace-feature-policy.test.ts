import {
  getVisibleWorkspaceSections,
  isWorkspaceFeatureVisible,
  workspaceFeatureStatus,
} from '@/features/workspaces/workspace-feature-policy';

describe('Workspace 기능 노출 정책', () => {
  test('계약이 확정된 일정·D-Day·멤버 탭만 노출한다', () => {
    expect(getVisibleWorkspaceSections()).toEqual([
      { value: 'tasks', label: '일정' },
      { value: 'ddays', label: 'D-Day' },
      { value: 'members', label: '멤버' },
    ]);
  });

  test('공유 템플릿과 서버 push 설정은 계약 전까지 숨긴다', () => {
    expect(workspaceFeatureStatus.sharedTemplates).toBe('contract-required');
    expect(workspaceFeatureStatus.serverPushSettings).toBe('contract-required');
    expect(isWorkspaceFeatureVisible('sharedTemplates')).toBe(false);
    expect(isWorkspaceFeatureVisible('serverPushSettings')).toBe(false);
  });
});
