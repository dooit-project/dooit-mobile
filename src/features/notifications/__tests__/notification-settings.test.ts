import { resolveNotificationPermissionState } from '../notification-settings';

describe('notification settings', () => {
  it.each([
    ['web', false, true, 'unsupported'],
    ['android', true, true, 'granted'],
    ['ios', false, true, 'undetermined'],
    ['android', false, false, 'denied'],
  ])('%s 권한 상태를 화면 상태로 변환한다', (platform, granted, canAskAgain, expected) => {
    expect(resolveNotificationPermissionState({ platform, granted, canAskAgain })).toBe(expected);
  });
});
