export function shouldScheduleWorkspaceNotifications(platform: string) {
  return platform === 'android' || platform === 'ios';
}

export function getWorkspaceNotificationIdentifier({
  accountId,
  workspaceId,
  notificationKey,
}: {
  accountId: number;
  workspaceId: number;
  notificationKey: string;
}) {
  return `workspace:${accountId}:${workspaceId}:${notificationKey}`;
}
