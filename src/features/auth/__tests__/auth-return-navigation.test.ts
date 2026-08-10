import { shouldShowFirstUseReturn } from '../auth-return-navigation';

describe('shouldShowFirstUseReturn', () => {
  it('최초 사용자가 인증 화면에 들어온 경우 시작 화면 복귀를 제공한다', () => {
    expect(shouldShowFirstUseReturn('error')).toBe(true);
  });

  it.each([
    ['expired', { expired: '1' }],
    ['guest expired', { guestExpired: '1' }],
    ['registered', { registered: '1' }],
  ])('%s 상태에는 최초 시작 복귀를 노출하지 않는다', (_, params) => {
    expect(shouldShowFirstUseReturn('error', params)).toBe(false);
  });

  it('유효한 게스트는 기존 게스트 복귀 동선을 사용한다', () => {
    expect(shouldShowFirstUseReturn('guest')).toBe(false);
  });
});
