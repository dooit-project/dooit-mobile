import { getGuestContinueMessage, getGuestRecoveryMessage } from '../guest-recovery-copy';

describe('게스트 복구 안내', () => {
  it('Web 저장소와 origin 한계를 안내한다', () => {
    expect(getGuestRecoveryMessage(true)).toContain('브라우저와 웹 주소');
    expect(getGuestRecoveryMessage(true)).toContain('복구할 수 없어요');
    expect(getGuestContinueMessage(true)).toContain('같은 웹 주소');
  });

  it('앱 삭제와 기기 저장 한계를 안내한다', () => {
    expect(getGuestRecoveryMessage(false)).toContain('앱을 삭제');
    expect(getGuestContinueMessage(false)).toContain('이 기기');
  });
});
