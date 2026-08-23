const { EXPECTED_FALLBACK, getWebRouteFallbackErrors } = require('../check-web-route-fallback');

describe('Web route fallback 검사', () => {
  const staticConfig = { expo: { web: { output: 'static' } } };

  test('static export와 200 rewrite를 허용한다', () => {
    expect(
      getWebRouteFallbackErrors({ appConfig: staticConfig, redirects: EXPECTED_FALLBACK }),
    ).toEqual([]);
  });

  test('3xx redirect는 직접 경로 보존 규칙으로 인정하지 않는다', () => {
    expect(
      getWebRouteFallbackErrors({ appConfig: staticConfig, redirects: '/* /index.html 302' }),
    ).toEqual([`public/_redirects에 "${EXPECTED_FALLBACK}" 규칙이 필요합니다.`]);
  });

  test('static export가 아니면 실패한다', () => {
    expect(
      getWebRouteFallbackErrors({
        appConfig: { expo: { web: { output: 'single' } } },
        redirects: EXPECTED_FALLBACK,
      }),
    ).toEqual(['expo.web.output은 static이어야 합니다.']);
  });
});
