const { getWebProductionConfigErrors } = require('../check-web-production-config');

describe('Web production config 검사', () => {
  test('real 모드와 HTTPS API URL을 허용한다', () => {
    expect(
      getWebProductionConfigErrors({
        EXPO_PUBLIC_API_MODE: 'real',
        EXPO_PUBLIC_API_URL: 'https://api.todolab.example',
      }),
    ).toEqual([]);
  });

  test('mock 모드와 HTTP API URL을 함께 거부한다', () => {
    expect(
      getWebProductionConfigErrors({
        EXPO_PUBLIC_API_MODE: 'mock',
        EXPO_PUBLIC_API_URL: 'http://api.todolab.example',
      }),
    ).toEqual([
      'EXPO_PUBLIC_API_MODE 또는 override가 real이어야 합니다.',
      '운영 Web API URL은 HTTPS를 사용해야 합니다.',
    ]);
  });

  test('override를 실제 export 값으로 우선한다', () => {
    expect(
      getWebProductionConfigErrors({
        EXPO_PUBLIC_API_MODE: 'mock',
        EXPO_PUBLIC_API_MODE_OVERRIDE: 'real',
        EXPO_PUBLIC_API_URL: 'http://localhost:8080',
        EXPO_PUBLIC_API_URL_OVERRIDE: 'https://api.todolab.example/v1',
      }),
    ).toEqual([]);
  });

  test('누락되거나 인증 정보가 포함된 URL을 거부한다', () => {
    expect(getWebProductionConfigErrors({ EXPO_PUBLIC_API_MODE: 'real' })).toEqual([
      'EXPO_PUBLIC_API_URL 또는 override가 필요합니다.',
    ]);
    expect(
      getWebProductionConfigErrors({
        EXPO_PUBLIC_API_MODE: 'real',
        EXPO_PUBLIC_API_URL: 'https://user:password@api.todolab.example',
      }),
    ).toEqual(['운영 Web API URL에 인증 정보를 포함할 수 없습니다.']);
  });
});
