const { assertTokenResponse } = require('../smoke-auth-real');

const token = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  expiresAt: '2026-08-27T12:15:00',
  refreshToken: 'refresh-token',
  refreshExpiresAt: '2026-09-27T12:00:00',
};

describe('auth real smoke contract', () => {
  it('access와 refresh credential이 모두 있으면 통과한다', () => {
    expect(() => assertTokenResponse(token, 'login')).not.toThrow();
  });

  it.each([
    ['accessToken', ''],
    ['expiresAt', null],
    ['refreshToken', ''],
    ['refreshExpiresAt', null],
  ])('%s 누락을 실패로 판정한다', (field, value) => {
    expect(() => assertTokenResponse({ ...token, [field]: value }, 'login')).toThrow(field);
  });
});
