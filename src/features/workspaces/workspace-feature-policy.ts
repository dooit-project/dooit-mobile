export type WorkspaceSection = 'tasks' | 'ddays' | 'members';

export type WorkspaceFeature = WorkspaceSection | 'sharedTemplates' | 'serverPushSettings';

type WorkspaceFeatureStatus = 'available' | 'contract-required';

export const workspaceFeatureStatus: Readonly<Record<WorkspaceFeature, WorkspaceFeatureStatus>> =
  Object.freeze({
    tasks: 'available',
    ddays: 'available',
    members: 'available',
    sharedTemplates: 'contract-required',
    serverPushSettings: 'contract-required',
  });

const workspaceSections: readonly { value: WorkspaceSection; label: string }[] = [
  { value: 'tasks', label: '일정' },
  { value: 'ddays', label: 'D-Day' },
  { value: 'members', label: '멤버' },
];

export function isWorkspaceFeatureVisible(feature: WorkspaceFeature) {
  return workspaceFeatureStatus[feature] === 'available';
}

export function getVisibleWorkspaceSections() {
  return workspaceSections.filter((section) => isWorkspaceFeatureVisible(section.value));
}
