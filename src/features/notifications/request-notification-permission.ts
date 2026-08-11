import { Platform } from 'react-native';

export async function requestLocalNotificationPermission() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks', {
      name: '일정과 할 일',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}
