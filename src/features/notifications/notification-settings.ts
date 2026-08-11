import { Linking, Platform } from 'react-native';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export function resolveNotificationPermissionState({
  platform,
  granted,
  canAskAgain,
}: {
  platform: string;
  granted: boolean;
  canAskAgain: boolean;
}): NotificationPermissionState {
  if (platform !== 'android' && platform !== 'ios') {
    return 'unsupported';
  }

  if (granted) {
    return 'granted';
  }

  return canAskAgain ? 'undetermined' : 'denied';
}

export async function getNotificationPermissionState() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return 'unsupported' as const;
  }

  const Notifications = await import('expo-notifications');
  const permissions = await Notifications.getPermissionsAsync();
  return resolveNotificationPermissionState({
    platform: Platform.OS,
    granted: permissions.granted,
    canAskAgain: permissions.canAskAgain,
  });
}

export function openNotificationSettings() {
  return Linking.openSettings();
}
