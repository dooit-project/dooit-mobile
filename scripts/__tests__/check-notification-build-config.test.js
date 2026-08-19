const { getNotificationBuildConfigFailures } = require('../lib/check-notification-build-config');

describe('getNotificationBuildConfigFailures', () => {
  const packageJson = {
    dependencies: { 'expo-notifications': '~56.0.18' },
  };

  it('의존성과 config plugin이 있으면 통과한다', () => {
    expect(
      getNotificationBuildConfigFailures(
        { plugins: ['expo-router', 'expo-notifications'] },
        packageJson,
      ),
    ).toEqual([]);
  });

  it('native config plugin 누락을 찾는다', () => {
    expect(getNotificationBuildConfigFailures({ plugins: ['expo-router'] }, packageJson)).toEqual([
      'app.json plugins must include expo-notifications for native builds',
    ]);
  });

  it('production dependency 누락을 찾는다', () => {
    expect(
      getNotificationBuildConfigFailures({ plugins: ['expo-notifications'] }, { dependencies: {} }),
    ).toEqual(['expo-notifications must be installed as a production dependency']);
  });

  it('options 배열 형태의 config plugin도 인식한다', () => {
    expect(
      getNotificationBuildConfigFailures(
        { plugins: [['expo-notifications', { mode: 'production' }]] },
        packageJson,
      ),
    ).toEqual([]);
  });
});
